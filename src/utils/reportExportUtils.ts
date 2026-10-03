import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  HeightRule,
  PageOrientation,
  VerticalAlign,
  UnderlineType,
  ImageRun,
  convertInchesToTwip
} from 'docx';
import { FarmParcel, OfficialSignatory } from '../types';
import { IrrigatorsDirectoryLetterData } from '../data/irrigatorsData';
import { MpcsrsReportData } from '../data/mpcsrsData';
import { OfficialReportLetter } from '../data/reportLetters';
import { getDisplayBarangay } from '../data/barangays';

export interface DocxPageOptions {
  orientation?: 'landscape' | 'portrait';
  paperSize?: string;
  margins?: string;
}

// Helper to parse farmer name
const parseFarmerName = (parcel: FarmParcel) => {
  if (parcel.farmerFamilyName && parcel.farmerGivenName) {
    return {
      family: parcel.farmerFamilyName.trim().toUpperCase(),
      given: parcel.farmerGivenName.trim().toUpperCase(),
      middle: (parcel.farmerMiddleName || '').trim().toUpperCase()
    };
  }
  const raw = (parcel.raiserName || '').trim();
  if (!raw) return { family: '', given: '', middle: '' };

  if (raw.includes(',')) {
    const [last, rest] = raw.split(',');
    const restParts = (rest || '').trim().split(/\s+/).filter(Boolean);
    const given = restParts[0] ? restParts[0].toUpperCase() : '';
    const middle = restParts.slice(1).join(' ').toUpperCase();
    return { family: last.trim().toUpperCase(), given, middle };
  }
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { family: parts[0].toUpperCase(), given: '', middle: '' };
  if (parts.length === 2) return { family: parts[1].toUpperCase(), given: parts[0].toUpperCase(), middle: '' };
  const family = parts[parts.length - 1].toUpperCase();
  const given = parts.slice(0, parts.length - 2).join(' ').toUpperCase() || parts[0].toUpperCase();
  const middle = parts[parts.length - 2].toUpperCase();
  return { family, given, middle };
};

const formatBday = (bday?: string) => {
  if (!bday) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(bday)) return bday;
  if (/^\d{4}-\d{2}-\d{2}$/.test(bday)) {
    const [y, m, d] = bday.split('-');
    return `${m}/${d}/${y}`;
  }
  return bday;
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Convert image URL or asset to Uint8Array via HTML Canvas
const imageSrcToUint8Array = async (src: string, width = 240, height = 240): Promise<Uint8Array | null> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      if (src.startsWith('http://') || src.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) return resolve(null);
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(new Uint8Array(reader.result as ArrayBuffer));
            };
            reader.onerror = () => resolve(null);
            reader.readAsArrayBuffer(blob);
          }, 'image/png');
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    } catch (e) {
      resolve(null);
    }
  });
};

let customLogoUrlsCache: Record<string, string | null> = {};

export const setReportCustomLogoCache = (logos: Record<string, string | null>) => {
  customLogoUrlsCache = { ...customLogoUrlsCache, ...logos };
};

export const getReportCustomLogo = (key: string): string | null => {
  return customLogoUrlsCache[key] || null;
};

// Generate high-resolution official Bagong Pilipinas logo
export const generateBagongPilipinasPng = async (): Promise<Uint8Array | null> => {
  const customUrl = getReportCustomLogo('silago_bagong_pilipinas_logo_url');
  if (customUrl) {
    const fromCustom = await imageSrcToUint8Array(customUrl, 240, 240);
    if (fromCustom) return fromCustom;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      ctx.clearRect(0, 0, 240, 240);

      // Blue Upper Swoosh
      ctx.fillStyle = '#0038A8';
      ctx.beginPath();
      ctx.moveTo(44, 112);
      ctx.bezierCurveTo(48, 60, 96, 28, 152, 32);
      ctx.bezierCurveTo(196, 36, 216, 68, 212, 100);
      ctx.bezierCurveTo(208, 76, 184, 52, 148, 48);
      ctx.bezierCurveTo(104, 44, 64, 72, 44, 112);
      ctx.closePath();
      ctx.fill();

      // Red Lower Swoosh
      ctx.fillStyle = '#CE1126';
      ctx.beginPath();
      ctx.moveTo(196, 128);
      ctx.bezierCurveTo(192, 180, 144, 212, 88, 208);
      ctx.bezierCurveTo(44, 204, 24, 172, 28, 140);
      ctx.bezierCurveTo(32, 164, 56, 188, 92, 192);
      ctx.bezierCurveTo(136, 196, 176, 168, 196, 128);
      ctx.closePath();
      ctx.fill();

      // Central Sun
      ctx.fillStyle = '#FCD116';
      ctx.beginPath();
      ctx.arc(120, 120, 32, 0, Math.PI * 2);
      ctx.fill();

      // 8 Sun Rays
      ctx.strokeStyle = '#FCD116';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const rad = (i * 45 * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(120 + 36 * Math.cos(rad), 120 + 36 * Math.sin(rad));
        ctx.lineTo(120 + 48 * Math.cos(rad), 120 + 48 * Math.sin(rad));
        ctx.stroke();
      }

      // 3 Stars
      const drawStar = (cx: number, cy: number, r: number) => {
        ctx.fillStyle = '#FCD116';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 72 - 90) * (Math.PI / 180);
          const ai = (i * 72 + 36 - 90) * (Math.PI / 180);
          if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
          else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
          ctx.lineTo(cx + r * 0.45 * Math.cos(ai), cy + r * 0.45 * Math.sin(ai));
        }
        ctx.closePath();
        ctx.fill();
      };

      drawStar(120, 52, 9);
      drawStar(60, 168, 9);
      drawStar(180, 168, 9);

      // Text "BAGONG PILIPINAS"
      ctx.fillStyle = '#0038A8';
      ctx.font = '900 15px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('BAGONG PILIPINAS', 120, 230);

      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(new Uint8Array(reader.result as ArrayBuffer));
        };
        reader.onerror = () => resolve(null);
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    } catch (e) {
      resolve(null);
    }
  });
};

// Generate Department of Agriculture (DA) seal
export const generateDepartmentOfAgriculturePng = async (): Promise<Uint8Array | null> => {
  const customUrl = getReportCustomLogo('silago_da_logo_url');
  if (customUrl) {
    const fromCustom = await imageSrcToUint8Array(customUrl, 240, 240);
    if (fromCustom) return fromCustom;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      ctx.clearRect(0, 0, 240, 240);

      // Outer green circle with gold border
      ctx.fillStyle = '#15612D';
      ctx.beginPath();
      ctx.arc(120, 120, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Inner dark green circle
      ctx.fillStyle = '#0D441E';
      ctx.beginPath();
      ctx.arc(120, 120, 98, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Gold stylized plant / shield
      ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.beginPath();
      ctx.moveTo(80, 160);
      ctx.bezierCurveTo(64, 120, 80, 80, 120, 60);
      ctx.bezierCurveTo(160, 80, 176, 120, 160, 160);
      ctx.closePath();
      ctx.fill();

      // Gold middle ring
      ctx.fillStyle = '#15612D';
      ctx.beginPath();
      ctx.arc(120, 120, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Bright yellow sun
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(120, 120, 34, 0, Math.PI * 2);
      ctx.fill();

      // Text "DA" in center
      ctx.fillStyle = '#15612D';
      ctx.font = '900 38px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DA', 120, 122);

      // Radial gold rays
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];
      rayAngles.forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(120 + 64 * Math.cos(rad), 120 + 64 * Math.sin(rad));
        ctx.lineTo(120 + 82 * Math.cos(rad), 120 + 82 * Math.sin(rad));
        ctx.stroke();
      });

      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(new Uint8Array(reader.result as ArrayBuffer));
        };
        reader.onerror = () => resolve(null);
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    } catch (e) {
      resolve(null);
    }
  });
};

// Generate Municipality of Silago Seal
export const generateSilagoSealPng = async (): Promise<Uint8Array | null> => {
  const customUrl = getReportCustomLogo('silago_seal_url');
  if (customUrl) {
    const fromCustom = await imageSrcToUint8Array(customUrl, 240, 240);
    if (fromCustom) return fromCustom;
  }

  const fromImg = await imageSrcToUint8Array('/assets/silago_seal.png', 240, 240);
  if (fromImg) return fromImg;

  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      ctx.clearRect(0, 0, 240, 240);

      // Outer Navy Circle
      ctx.fillStyle = '#0B2B64';
      ctx.beginPath();
      ctx.arc(120, 120, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#EAB308';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Inner White Ring
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(120, 120, 96, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0B2B64';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sky Blue Center
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(120, 120, 72, 0, Math.PI * 2);
      ctx.fill();

      // Green Heraldic Shield
      ctx.fillStyle = '#15803D';
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(120, 60);
      ctx.lineTo(152, 75);
      ctx.lineTo(152, 125);
      ctx.lineTo(120, 155);
      ctx.lineTo(88, 125);
      ctx.lineTo(88, 75);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sun & Rice Land inside shield
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(120, 95, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#CA8A04';
      ctx.beginPath();
      ctx.moveTo(94, 130);
      ctx.quadraticCurveTo(120, 115, 146, 130);
      ctx.lineTo(140, 142);
      ctx.quadraticCurveTo(120, 152, 100, 142);
      ctx.closePath();
      ctx.fill();

      // Text MUNICIPALITY OF SILAGO
      ctx.fillStyle = '#0B2B64';
      ctx.font = '900 13px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MUNICIPALITY OF SILAGO', 120, 42);
      ctx.font = '800 11px Arial, Helvetica, sans-serif';
      ctx.fillText('SOUTHERN LEYTE', 120, 210);

      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(new Uint8Array(reader.result as ArrayBuffer));
        };
        reader.onerror = () => resolve(null);
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    } catch (e) {
      resolve(null);
    }
  });
};

// Generate Official Seal of the Province of Southern Leyte
export const generateSouthernLeyteSealPng = async (): Promise<Uint8Array | null> => {
  const customUrl = getReportCustomLogo('silago_southern_leyte_logo_url');
  if (customUrl) {
    const fromCustom = await imageSrcToUint8Array(customUrl, 240, 240);
    if (fromCustom) return fromCustom;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      ctx.clearRect(0, 0, 240, 240);

      // Outer green ring with gold border
      ctx.fillStyle = '#14532D';
      ctx.beginPath();
      ctx.arc(120, 120, 116, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#CA8A04';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Golden yellow text ring
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(120, 120, 104, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#15803D';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top text "SAGISAG NG TIMOG LEYTE"
      ctx.fillStyle = '#14532D';
      ctx.font = '900 13px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SAGISAG NG TIMOG LEYTE', 120, 36);

      // Bottom text "OFFICIAL SEAL"
      ctx.font = '800 11px Arial, Helvetica, sans-serif';
      ctx.fillText('• OFFICIAL SEAL •', 120, 218);

      // Inner sky blue circle
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(120, 120, 74, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#CA8A04';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Heraldic Shield
      ctx.fillStyle = '#15803D';
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(120, 56);
      ctx.lineTo(156, 70);
      ctx.bezierCurveTo(156, 108, 140, 140, 120, 152);
      ctx.bezierCurveTo(100, 140, 84, 108, 84, 70);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Central Sun
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(120, 90, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#CA8A04';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sun rays
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const rad = (i * 45 * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(120 + 16 * Math.cos(rad), 120 + 16 * Math.sin(rad));
        ctx.lineTo(120 + 24 * Math.cos(rad), 120 + 24 * Math.sin(rad));
        ctx.stroke();
      }

      // Rice land waves
      ctx.fillStyle = '#CA8A04';
      ctx.beginPath();
      ctx.moveTo(90, 124);
      ctx.quadraticCurveTo(120, 108, 150, 124);
      ctx.lineTo(144, 136);
      ctx.quadraticCurveTo(120, 146, 96, 136);
      ctx.closePath();
      ctx.fill();

      // Three small stars
      const drawMiniStar = (cx: number, cy: number, r: number) => {
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 72 - 90) * (Math.PI / 180);
          const ai = (i * 72 + 36 - 90) * (Math.PI / 180);
          if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
          else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
          ctx.lineTo(cx + r * 0.45 * Math.cos(ai), cy + r * 0.45 * Math.sin(ai));
        }
        ctx.closePath();
        ctx.fill();
      };
      drawMiniStar(120, 50, 6);
      drawMiniStar(86, 100, 5);
      drawMiniStar(154, 100, 5);

      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(new Uint8Array(reader.result as ArrayBuffer));
        };
        reader.onerror = () => resolve(null);
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    } catch (e) {
      resolve(null);
    }
  });
};

// Generate Bag-ong Silago Logo (Aktibo. Pursigido. Bag-ong Silago)
export const generateBagOngSilagoPng = async (): Promise<Uint8Array | null> => {
  const customUrl = getReportCustomLogo('silago_bag_ong_logo_url');
  if (customUrl) {
    const fromCustom = await imageSrcToUint8Array(customUrl, 240, 240);
    if (fromCustom) return fromCustom;
  }

  const fromSvg = await imageSrcToUint8Array('/assets/bag_ong_silago.svg', 240, 240);
  if (fromSvg) return fromSvg;

  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      ctx.clearRect(0, 0, 240, 240);

      // Outer gold circle
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(120, 120, 114, 0, Math.PI * 2);
      ctx.fill();

      // Inner white disc
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(120, 120, 106, 0, Math.PI * 2);
      ctx.fill();

      // Green & Blue mountain waves
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(120, 120, 94, 0, Math.PI);
      ctx.fill();

      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.moveTo(30, 120);
      ctx.quadraticCurveTo(80, 80, 120, 120);
      ctx.quadraticCurveTo(160, 160, 210, 120);
      ctx.lineTo(210, 150);
      ctx.lineTo(30, 150);
      ctx.closePath();
      ctx.fill();

      // Text "BAG-ONG SILAGO"
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 16px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BAG-ONG SILAGO', 120, 70);

      ctx.font = '700 10px Arial, Helvetica, sans-serif';
      ctx.fillStyle = '#D97706';
      ctx.fillText('AKTIBO • PURSIGIDO', 120, 90);

      ctx.font = '800 9px Arial, Helvetica, sans-serif';
      ctx.fillStyle = '#059669';
      ctx.fillText('LOVE • PEACE • HOPE', 120, 190);

      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(new Uint8Array(reader.result as ArrayBuffer));
        };
        reader.onerror = () => resolve(null);
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    } catch (e) {
      resolve(null);
    }
  });
};

// =========================================================================
// OFFICIAL GOVERNMENT REPORT HEADER HELPERS FOR DOCX
// Strictly complies with:
// 1. No outlined 3-column table across page width.
// 2. Center-aligned 3 logos side-by-side with locked 65px dimensions.
// 3. 12-16px uniform margin between logos.
// 4. "Inline with text" image wrapping directly in document model.
// 5. Strictly center-aligned official hierarchy text directly below logos.
// =========================================================================

export const createOfficialHeaderLogosParagraph = (
  logo1Bytes: Uint8Array | null,
  logo2Bytes: Uint8Array | null,
  logo3Bytes: Uint8Array | null,
  options?: {
    sizePt?: number;
    spacingBefore?: number;
    spacingAfter?: number;
  }
): Paragraph => {
  const sizePt = options?.sizePt ?? 65; // Locked 65px (~0.7 inches)
  const spacingBefore = options?.spacingBefore ?? 0;
  const spacingAfter = options?.spacingAfter ?? 60;

  const validLogos = [logo1Bytes, logo2Bytes, logo3Bytes].filter(
    (b): b is Uint8Array => !!b && b.length > 0
  );

  const children: (ImageRun | TextRun)[] = [];

  validLogos.forEach((logoData, index) => {
    if (index > 0) {
      // Uniform 12px-16px margin/spacing between logos (4 spaces in 24 half-pt font ≈ 15px)
      children.push(
        new TextRun({
          text: '    ',
          size: 24,
          font: 'Arial'
        })
      );
    }

    children.push(
      new ImageRun({
        data: logoData,
        transformation: {
          width: sizePt,
          height: sizePt
        },
        type: 'png'
      })
    );
  });

  return new Paragraph({
    children,
    alignment: AlignmentType.CENTER,
    spacing: { before: spacingBefore, after: spacingAfter },
    keepNext: true
  });
};

export const createOfficialLetterheadParagraphs = (options?: {
  country?: string;
  province?: string;
  municipality?: string;
  office?: string;
  showDivider?: boolean;
}): Paragraph[] => {
  const country = options?.country || 'Republic of the Philippines';
  const province = options?.province || 'Province of Southern Leyte';
  const municipality = options?.municipality || 'MUNICIPALITY OF SILAGO';
  const office = options?.office || 'MUNICIPAL AGRICULTURE OFFICE';
  const showDivider = options?.showDivider !== false;

  return [
    new Paragraph({
      children: [
        new TextRun({
          text: country,
          size: 19,
          font: 'Arial'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 20, after: 20 },
      keepNext: true
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: province,
          size: 19,
          font: 'Arial'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      keepNext: true
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: municipality,
          bold: true,
          size: 24,
          font: 'Times New Roman'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      keepNext: true
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: office,
          bold: true,
          size: 20,
          font: 'Arial'
        })
      ],
      alignment: AlignmentType.CENTER,
      border: showDivider
        ? {
            bottom: {
              color: '000000',
              space: 6,
              style: BorderStyle.SINGLE,
              size: 12
            }
          }
        : undefined,
      spacing: { after: 120 },
      keepNext: true
    })
  ];
};

const getPageDimensions = (options?: DocxPageOptions) => {
  const isLandscape = options?.orientation !== 'portrait';
  const paper = (options?.paperSize || 'folio').toLowerCase();

  // Width and height in twips (1 inch = 1440 twips)
  let shortSide = 8.5 * 1440; // 12240
  let longSide = 13.0 * 1440; // 18720 (Folio / Long Bond default)

  if (paper === 'a4') {
    shortSide = 8.27 * 1440; // 11909
    longSide = 11.69 * 1440; // 16834
  } else if (paper === 'letter') {
    shortSide = 8.5 * 1440; // 12240
    longSide = 11.0 * 1440; // 15840
  } else if (paper === 'legal') {
    shortSide = 8.5 * 1440; // 12240
    longSide = 14.0 * 1440; // 20160
  }

  const width = isLandscape ? longSide : shortSide;
  const height = isLandscape ? shortSide : longSide;

  return {
    size: {
      width: Math.round(width),
      height: Math.round(height),
      orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
    },
    margin: {
      top: convertInchesToTwip(0.5),
      bottom: convertInchesToTwip(0.5),
      left: convertInchesToTwip(0.5),
      right: convertInchesToTwip(0.5)
    }
  };
};

// ==========================================
// EXCEL (.XLSX) EXPORT IMPLEMENTATIONS
// ==========================================

export const exportRegistryTableExcel = (
  parcels: FarmParcel[],
  visibleColumns: Record<string, boolean>,
  selectedBarangay: string,
  reportDate: string,
  memoRef: string,
  signatories: OfficialSignatory[]
) => {
  const colKeys = [
    'rsbsaNo',
    'familyName',
    'givenName',
    'middleName',
    'barangay',
    'municipality',
    'province',
    'birthday',
    'farmLocation',
    'latitude',
    'longitude',
    'farmArea',
    'commodity'
  ].filter((k) => visibleColumns[k] !== false);

  const headerLabels: Record<string, string> = {
    rsbsaNo: 'RSBSA NO.',
    familyName: 'FAMILY NAME',
    givenName: 'GIVEN NAME',
    middleName: 'MIDDLE NAME',
    barangay: 'BARANGAY',
    municipality: 'MUNICIPALITY',
    province: 'PROVINCE',
    birthday: 'BIRTHDAY',
    farmLocation: 'FARM LOCATION',
    latitude: 'LATITUDE',
    longitude: 'LONGITUDE',
    farmArea: 'FARM AREA (ha)',
    commodity: 'COMMODITY PLANTED'
  };

  const dataRows: (string | number)[][] = [
    ['REPUBLIC OF THE PHILIPPINES'],
    ['PROVINCE OF SOUTHERN LEYTE'],
    ['MUNICIPALITY OF SILAGO'],
    ['OFFICE OF THE MUNICIPAL AGRICULTURIST'],
    [''],
    ['OFFICIAL REGISTRY SYSTEM FOR BASIC SECTORS IN AGRICULTURE (RSBSA) - RICE MASTERLIST'],
    [`COVERAGE: ${selectedBarangay === 'ALL' ? 'ALL BARANGAYS' : `BARANGAY ${selectedBarangay.toUpperCase()}`}`],
    [`DATE ISSUED: ${reportDate} | MEMO REF: ${memoRef}`],
    [''],
    colKeys.map((k) => headerLabels[k])
  ];

  let totalArea = 0;
  parcels.forEach((p) => {
    const { family, given, middle } = parseFarmerName(p);
    const bday = formatBday(p.birthday);
    const farmLoc = p.purok
      ? `${p.purok}, Brgy. ${getDisplayBarangay(p.barangay)}`
      : `Brgy. ${getDisplayBarangay(p.barangay)}`;
    const area = Number(p.weightKg || 0);
    totalArea += area;

    const rowObj: Record<string, string | number> = {
      rsbsaNo: p.swineNameOrId || '',
      familyName: family,
      givenName: given,
      middleName: middle,
      barangay: getDisplayBarangay(p.barangay),
      municipality: 'SILAGO',
      province: 'SOUTHERN LEYTE',
      birthday: bday,
      farmLocation: farmLoc.toUpperCase(),
      latitude: p.lat ? p.lat.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : '',
      longitude: p.lng ? p.lng.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : '',
      farmArea: area > 0 ? area : '',
      commodity: (p.commodity || 'RICE').toUpperCase()
    };

    dataRows.push(colKeys.map((k) => rowObj[k]));
  });

  // Summary Row
  dataRows.push(['']);
  const summaryRow = colKeys.map((k) => {
    if (k === colKeys[0]) return 'TOTAL RECORD COUNT: ' + parcels.length;
    if (k === 'farmArea') return `TOTAL AREA: ${totalArea.toFixed(2)} ha`;
    return '';
  });
  dataRows.push(summaryRow);

  // Signatories
  dataRows.push(['']);
  dataRows.push(['OFFICIAL CERTIFICATION & SIGNATURES']);
  dataRows.push(['']);

  const sigRoles: string[] = [];
  const sigSpaces: string[] = [];
  const sigNames: string[] = [];
  const sigTitles: string[] = [];

  signatories.forEach((sig) => {
    sigRoles.push(sig.roleLabel || 'Certified by:');
    sigRoles.push('');
    sigSpaces.push('');
    sigSpaces.push('');
    sigNames.push(sig.name ? sig.name.toUpperCase() : '___________________________');
    sigNames.push('');
    sigTitles.push(sig.title ? sig.title.toUpperCase() : 'SIGNATURE OVER PRINTED NAME');
    sigTitles.push('');
  });

  dataRows.push(sigRoles);
  dataRows.push(sigSpaces);
  dataRows.push(sigSpaces);
  dataRows.push(sigNames);
  dataRows.push(sigTitles);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(dataRows);

  // Auto-size columns
  ws['!cols'] = colKeys.map((k) => ({
    wch: k === 'rsbsaNo' ? 22 : k === 'farmLocation' ? 25 : k === 'familyName' || k === 'givenName' ? 18 : 14
  }));

  XLSX.utils.book_append_sheet(wb, ws, 'RSBSA Masterlist');
  const safeBrgy = (selectedBarangay || 'Silago').replace(/\s+/g, '_');
  XLSX.writeFile(wb, `Masterlist_Registry_${safeBrgy}.xlsx`);
};

export const exportMpcsrsExcel = (data: MpcsrsReportData) => {
  const dataRows: (string | number)[][] = [
    ['MONTHLY PALAY AND CORN SITUATION REPORTING SYSTEM (MPCSRS)'],
    [`REGION: ${data.region}`],
    [`MUNICIPALITY / PROVINCE: ${data.municipalityProvince}`],
    [''],
    [
      'NO.',
      'BARANGAY',
      'VALIDATED AREA (ha)',
      'NEWLY PLANTED (ha)',
      'VEGETATIVE STAGE (ha)',
      'REPRODUCTIVE STAGE (ha)',
      'MATURING STAGE (ha)',
      'TECHNICIAN IN CHARGE'
    ]
  ];

  let itemIdx = 1;
  data.groups.forEach((grp) => {
    grp.rows.forEach((row) => {
      dataRows.push([
        itemIdx++,
        row.barangay,
        row.validatedAreaHa || '',
        row.newlyPlantedHa || '',
        row.vegetativeStageHa || '',
        row.reproductiveStageHa || '',
        row.maturingStageHa || '',
        grp.technicianName || ''
      ]);
    });
    if (grp.subtotalAreaHa) {
      dataRows.push([
        '',
        'SUB-TOTAL:',
        grp.subtotalAreaHa,
        '',
        '',
        '',
        '',
        `Technician: ${grp.technicianName || ''}`
      ]);
    }
  });

  dataRows.push(['']);
  dataRows.push(['GRAND TOTAL VALIDATED AREA (ha):', '', data.totalValidatedAreaHa]);
  dataRows.push(['']);
  dataRows.push(['OFFICIAL CERTIFICATION & SIGNATURES:']);
  dataRows.push(['']);

  const sigs =
    data.signatories && data.signatories.length > 0
      ? data.signatories
      : [
          {
            id: 'sig-1',
            roleLabel: 'Prepared by:',
            name: data.preparedByName || '',
            title: data.preparedByTitle || 'Signature over Printed Name / Designation'
          },
          {
            id: 'sig-2',
            roleLabel: 'Approved by:',
            name: data.approvedByName || 'JUNIE T. ELMIDO',
            title: data.approvedByTitle || 'Municipal/City Agriculturist'
          }
        ];

  const sigRoles: string[] = [];
  const sigNames: string[] = [];
  const sigTitles: string[] = [];

  sigs.forEach((s) => {
    sigRoles.push(s.roleLabel);
    sigRoles.push('');
    sigNames.push(s.name ? s.name.toUpperCase() : '___________________________');
    sigNames.push('');
    sigTitles.push(s.title ? s.title.toUpperCase() : '');
    sigTitles.push('');
  });

  dataRows.push(sigRoles);
  dataRows.push(['', '', '', '']);
  dataRows.push(['', '', '', '']);
  dataRows.push(sigNames);
  dataRows.push(sigTitles);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  ws['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, ws, 'MPCSRS Report');
  XLSX.writeFile(wb, 'MPCSRS_Palay_Report.xlsx');
};

export const exportIrrigatorsExcel = (data: IrrigatorsDirectoryLetterData) => {
  const dataRows: (string | number)[][] = [
    [data.republicHeader || 'REPUBLIC OF THE PHILIPPINES'],
    [data.provinceHeader || 'PROVINCE OF SOUTHERN LEYTE'],
    [data.municipalityHeader || 'MUNICIPALITY OF SILAGO'],
    [data.officeHeader || 'OFFICE OF THE MUNICIPAL AGRICULTURIST'],
    [''],
    ['DIRECTORY OF IRRIGATORS ASSOCIATIONS & RICE PRODUCTION OVERVIEW'],
    [`TOTAL IRRIGATED AREA: ${data.totalIrrigatedAreaHa} ha`],
    [`TOTAL RAINFED AREA: ${data.totalRainfedAreaHa} ha`],
    [`TOTAL REGISTERED RICE FARMERS: ${data.totalRiceFarmersCount}`],
    [''],
    ['NO.', 'NAME OF IRRIGATORS ASSOCIATION', 'CONTACT PERSON / PRESIDENT', 'BARANGAY LOCATION']
  ];

  data.associations.forEach((assoc, i) => {
    dataRows.push([i + 1, assoc.associationName, assoc.contactPerson, assoc.barangay]);
  });

  dataRows.push(['']);
  dataRows.push(['OFFICIAL CERTIFICATION & SIGNATURES:']);
  dataRows.push(['']);

  const sigs =
    data.signatories && data.signatories.length > 0
      ? data.signatories
      : [
          {
            id: 'sig-1',
            roleLabel: 'Prepared by:',
            name: data.preparedByName || '',
            title: data.preparedByTitle || 'Signature over Printed Name / Designation'
          },
          {
            id: 'sig-2',
            roleLabel: 'Noted by:',
            name: data.notedByName || 'CAREIN M. TOMOL',
            title: data.notedByTitle || 'MAO-OIC'
          }
        ];

  const sigRoles: string[] = [];
  const sigNames: string[] = [];
  const sigTitles: string[] = [];

  sigs.forEach((s) => {
    sigRoles.push(s.roleLabel);
    sigRoles.push('');
    sigNames.push(s.name ? s.name.toUpperCase() : '___________________________');
    sigNames.push('');
    sigTitles.push(s.title ? s.title.toUpperCase() : '');
    sigTitles.push('');
  });

  dataRows.push(sigRoles);
  dataRows.push(['', '', '', '']);
  dataRows.push(sigNames);
  dataRows.push(sigTitles);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  ws['!cols'] = [{ wch: 8 }, { wch: 45 }, { wch: 30 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Irrigators Directory');
  XLSX.writeFile(wb, 'Irrigators_Directory_Silago.xlsx');
};

export const exportLetterExcel = (
  letter: OfficialReportLetter,
  signatories: OfficialSignatory[]
) => {
  const dataRows: (string | number)[][] = [
    [letter.republicHeader || 'REPUBLIC OF THE PHILIPPINES'],
    [letter.provinceHeader || 'PROVINCE OF SOUTHERN LEYTE'],
    [letter.municipalityHeader || 'MUNICIPALITY OF SILAGO'],
    [letter.officeHeader || 'OFFICE OF THE MUNICIPAL AGRICULTURIST'],
    [''],
    [`MEMORANDUM REF: ${letter.memoRef || ''}`],
    [`DATE: ${letter.date || ''}`],
    [''],
    [`FOR: ${letter.memorandumFor || ''}`],
    [`DESIGNATION: ${letter.memorandumForTitle || ''}`],
    letter.thru ? [`THRU: ${letter.thru} (${letter.thruTitle || ''})`] : [''],
    [`FROM: ${letter.from || ''} (${letter.fromTitle || ''})`],
    [''],
    [`SUBJECT: ${letter.subject || ''}`],
    [''],
    [`GREETING: ${letter.openingGreeting || 'Sir/Madam:'}`],
    [''],
    [`BODY PARAGRAPH 1: ${letter.bodyParagraph1 || ''}`],
    [''],
    [`BODY PARAGRAPH 2: ${letter.bodyParagraph2 || ''}`],
    [''],
    [`CLOSING: ${letter.closingStatement || 'Respectfully submitted,'}`],
    [''],
    ['OFFICIAL SIGNATORIES:']
  ];

  const sigs = letter.signatories && letter.signatories.length > 0 ? letter.signatories : signatories;
  sigs.forEach((s) => {
    dataRows.push(['']);
    dataRows.push([s.roleLabel]);
    dataRows.push(['___________________________']);
    dataRows.push([s.name ? s.name.toUpperCase() : '']);
    dataRows.push([s.title ? s.title.toUpperCase() : '']);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  ws['!cols'] = [{ wch: 30 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Official Letter');
  XLSX.writeFile(wb, 'Transmittal_Letter_Silago.xlsx');
};

// ==========================================
// WORD (.DOCX) EXPORT IMPLEMENTATIONS
// ==========================================

export const exportRegistryTableWord = async (
  parcels: FarmParcel[],
  visibleColumns: Record<string, boolean>,
  selectedBarangay: string,
  reportDate: string,
  memoRef: string,
  signatories: OfficialSignatory[],
  options?: DocxPageOptions
) => {
  const pageProps = getPageDimensions(options);

  // 1. Generate official logos in parallel
  const [daBytes, silagoBytes, bagOngSilagoBytes, bagongPilipinasBytes] = await Promise.all([
    generateDepartmentOfAgriculturePng(),
    generateSilagoSealPng(),
    generateBagOngSilagoPng(),
    generateBagongPilipinasPng()
  ]);

  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  const noBorders = {
    top: borderNone,
    bottom: borderNone,
    left: borderNone,
    right: borderNone
  };

  // Header Logos (3 logos clustered closely together centered at the top with locked 65px dimensions)
  const headerLogosParagraph = createOfficialHeaderLogosParagraph(
    daBytes,
    silagoBytes,
    bagOngSilagoBytes || bagongPilipinasBytes,
    { sizePt: 65 }
  );

  const letterheadParagraphs = createOfficialLetterheadParagraphs({
    country: 'Republic of the Philippines',
    province: 'Province of Southern Leyte',
    municipality: 'MUNICIPALITY OF SILAGO',
    office: 'MUNICIPAL AGRICULTURE OFFICE'
  });

  // Determine active visible columns and subcolumns
  const colKeys = [
    'rsbsaNo',
    'familyName',
    'givenName',
    'middleName',
    'barangay',
    'municipality',
    'province',
    'birthday',
    'farmLocation',
    'latitude',
    'longitude',
    'farmArea',
    'commodity'
  ].filter((k) => visibleColumns[k] !== false);

  const visibleNameCols = ['familyName', 'givenName', 'middleName'].filter((c) => visibleColumns[c] !== false);
  const visibleAddressCols = ['barangay', 'municipality', 'province'].filter((c) => visibleColumns[c] !== false);
  const visibleGpsCols = ['latitude', 'longitude'].filter((c) => visibleColumns[c] !== false);
  const hasAnyGroup = visibleNameCols.length > 0 || visibleAddressCols.length > 0 || visibleGpsCols.length > 0;

  // Standard table cell borders and margins (0.5pt black border, 3pt top/bottom padding, 4pt left/right)
  const cellBorderDef = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const cellBorders = {
    top: cellBorderDef,
    bottom: cellBorderDef,
    left: cellBorderDef,
    right: cellBorderDef
  };
  const cellMargins = {
    top: 60, // 3pt
    bottom: 60, // 3pt
    left: 80, // 4pt
    right: 80 // 4pt
  };

  // Header Row 1
  const headerRow1Cells: TableCell[] = [];

  if (visibleColumns.rsbsaNo !== false) {
    headerRow1Cells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'RSBSA NO.', bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        rowSpan: hasAnyGroup ? 2 : 1,
        shading: { fill: 'F8FAFC' },
        borders: cellBorders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER
      })
    );
  }

  if (visibleNameCols.length > 0) {
    headerRow1Cells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'NAME', bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        columnSpan: visibleNameCols.length,
        shading: { fill: 'F8FAFC' },
        borders: cellBorders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER
      })
    );
  }

  if (visibleAddressCols.length > 0) {
    headerRow1Cells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'RESIDENTIAL ADDRESS', bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        columnSpan: visibleAddressCols.length,
        shading: { fill: 'F8FAFC' },
        borders: cellBorders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER
      })
    );
  }

  if (visibleColumns.birthday !== false) {
    headerRow1Cells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'BIRTHDAY', bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        rowSpan: hasAnyGroup ? 2 : 1,
        shading: { fill: 'F8FAFC' },
        borders: cellBorders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER
      })
    );
  }

  if (visibleColumns.farmLocation !== false) {
    headerRow1Cells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'FARM LOCATION', bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        rowSpan: hasAnyGroup ? 2 : 1,
        shading: { fill: 'F8FAFC' },
        borders: cellBorders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER
      })
    );
  }

  if (visibleGpsCols.length > 0) {
    headerRow1Cells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'GPS COORDINATE', bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        columnSpan: visibleGpsCols.length,
        shading: { fill: 'F8FAFC' },
        borders: cellBorders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER
      })
    );
  }

  if (visibleColumns.farmArea !== false) {
    headerRow1Cells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'FARM AREA (ha)', bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        rowSpan: hasAnyGroup ? 2 : 1,
        shading: { fill: 'F8FAFC' },
        borders: cellBorders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER
      })
    );
  }

  if (visibleColumns.commodity !== false) {
    headerRow1Cells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'COMMODITY PLANTED', bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        rowSpan: hasAnyGroup ? 2 : 1,
        shading: { fill: 'F8FAFC' },
        borders: cellBorders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER
      })
    );
  }

  // Header Row 2 (Subcolumns)
  const headerRow2Cells: TableCell[] = [];
  if (hasAnyGroup) {
    if (visibleColumns.familyName !== false) {
      headerRow2Cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'FAMILY NAME', bold: true, size: 16, font: 'Arial' })],
              alignment: AlignmentType.CENTER
            })
          ],
          shading: { fill: 'F8FAFC' },
          borders: cellBorders,
          margins: cellMargins,
          verticalAlign: VerticalAlign.CENTER
        })
      );
    }
    if (visibleColumns.givenName !== false) {
      headerRow2Cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'GIVEN NAME', bold: true, size: 16, font: 'Arial' })],
              alignment: AlignmentType.CENTER
            })
          ],
          shading: { fill: 'F8FAFC' },
          borders: cellBorders,
          margins: cellMargins,
          verticalAlign: VerticalAlign.CENTER
        })
      );
    }
    if (visibleColumns.middleName !== false) {
      headerRow2Cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'MIDDLE NAME', bold: true, size: 16, font: 'Arial' })],
              alignment: AlignmentType.CENTER
            })
          ],
          shading: { fill: 'F8FAFC' },
          borders: cellBorders,
          margins: cellMargins,
          verticalAlign: VerticalAlign.CENTER
        })
      );
    }
    if (visibleColumns.barangay !== false) {
      headerRow2Cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'BARANGAY', bold: true, size: 16, font: 'Arial' })],
              alignment: AlignmentType.CENTER
            })
          ],
          shading: { fill: 'F8FAFC' },
          borders: cellBorders,
          margins: cellMargins,
          verticalAlign: VerticalAlign.CENTER
        })
      );
    }
    if (visibleColumns.municipality !== false) {
      headerRow2Cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'MUNICIPALITY', bold: true, size: 16, font: 'Arial' })],
              alignment: AlignmentType.CENTER
            })
          ],
          shading: { fill: 'F8FAFC' },
          borders: cellBorders,
          margins: cellMargins,
          verticalAlign: VerticalAlign.CENTER
        })
      );
    }
    if (visibleColumns.province !== false) {
      headerRow2Cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'PROVINCE', bold: true, size: 16, font: 'Arial' })],
              alignment: AlignmentType.CENTER
            })
          ],
          shading: { fill: 'F8FAFC' },
          borders: cellBorders,
          margins: cellMargins,
          verticalAlign: VerticalAlign.CENTER
        })
      );
    }
    if (visibleColumns.latitude !== false) {
      headerRow2Cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'LATITUDE', bold: true, size: 16, font: 'Arial' })],
              alignment: AlignmentType.CENTER
            })
          ],
          shading: { fill: 'F8FAFC' },
          borders: cellBorders,
          margins: cellMargins,
          verticalAlign: VerticalAlign.CENTER
        })
      );
    }
    if (visibleColumns.longitude !== false) {
      headerRow2Cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'LONGITUDE', bold: true, size: 16, font: 'Arial' })],
              alignment: AlignmentType.CENTER
            })
          ],
          shading: { fill: 'F8FAFC' },
          borders: cellBorders,
          margins: cellMargins,
          verticalAlign: VerticalAlign.CENTER
        })
      );
    }
  }

  const tableRows: TableRow[] = [
    new TableRow({
      children: headerRow1Cells,
      tableHeader: true,
      cantSplit: true
    })
  ];

  if (hasAnyGroup && headerRow2Cells.length > 0) {
    tableRows.push(
      new TableRow({
        children: headerRow2Cells,
        tableHeader: true,
        cantSplit: true
      })
    );
  }

  let totalArea = 0;

  parcels.forEach((p, idx) => {
    const { family, given, middle } = parseFarmerName(p);
    const bday = formatBday(p.birthday);
    const farmLoc = p.purok
      ? `${p.purok}, Brgy. ${getDisplayBarangay(p.barangay)}`
      : `Brgy. ${getDisplayBarangay(p.barangay)}`;
    const area = Number(p.weightKg || 0);
    totalArea += area;

    const valMap: Record<string, string> = {
      rsbsaNo: p.swineNameOrId || 'NO RSBSA',
      familyName: family,
      givenName: given,
      middleName: middle,
      barangay: getDisplayBarangay(p.barangay),
      municipality: 'SILAGO',
      province: 'SOUTHERN LEYTE',
      birthday: bday,
      farmLocation: farmLoc.toUpperCase(),
      latitude: p.lat ? p.lat.toFixed(6) : '',
      longitude: p.lng ? p.lng.toFixed(6) : '',
      farmArea: area > 0 ? area.toFixed(2) : '0.00',
      commodity: (p.commodity || 'RICE').toUpperCase()
    };

    const isShaded = idx % 2 === 1;

    const rowCells = colKeys.map((k) => {
      const isNumOrCode = ['rsbsaNo', 'birthday', 'latitude', 'longitude', 'commodity'].includes(k);
      const isArea = k === 'farmArea';
      const isName = ['familyName', 'givenName'].includes(k);

      const align = isArea
        ? AlignmentType.RIGHT
        : isNumOrCode
        ? AlignmentType.CENTER
        : AlignmentType.LEFT;

      return new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: valMap[k] || '',
                size: 16.5,
                font: 'Arial',
                bold: isName || k === 'rsbsaNo'
              })
            ],
            alignment: align
          })
        ],
        borders: cellBorders,
        margins: cellMargins,
        shading: isShaded ? { fill: 'FAFAFA' } : undefined,
        verticalAlign: VerticalAlign.CENTER
      });
    });

    tableRows.push(
      new TableRow({
        children: rowCells,
        cantSplit: true
      })
    );
  });

  // Table Summary Footer Row
  const colsBeforeArea = colKeys.filter((k) => k !== 'farmArea' && k !== 'commodity').length;
  const footerCells: TableCell[] = [];

  if (colsBeforeArea > 0) {
    footerCells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `TOTAL REGISTERED AREA (HA) & FARMER COUNT:`,
                bold: true,
                size: 17,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.RIGHT
          })
        ],
        columnSpan: colsBeforeArea,
        borders: cellBorders,
        margins: cellMargins,
        shading: { fill: 'F1F5F9' },
        verticalAlign: VerticalAlign.CENTER
      })
    );
  }

  if (visibleColumns.farmArea !== false) {
    footerCells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: totalArea.toFixed(2),
                bold: true,
                size: 17,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.RIGHT
          })
        ],
        borders: cellBorders,
        margins: cellMargins,
        shading: { fill: 'F1F5F9' },
        verticalAlign: VerticalAlign.CENTER
      })
    );
  }

  if (visibleColumns.commodity !== false) {
    footerCells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `${parcels.length} Records`,
                bold: true,
                size: 16,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER
          })
        ],
        borders: cellBorders,
        margins: cellMargins,
        shading: { fill: 'F1F5F9' },
        verticalAlign: VerticalAlign.CENTER
      })
    );
  }

  tableRows.push(
    new TableRow({
      children: footerCells,
      cantSplit: true
    })
  );

  // 3 Official Signatory Blocks
  const defaultSignatories: OfficialSignatory[] = [
    {
      id: 'sig-1',
      roleLabel: 'PREPARED & VERIFIED BY:',
      name: 'WELLA S. BONGON',
      title: 'Rice Technician / Agricultural Technologist'
    },
    {
      id: 'sig-2',
      roleLabel: 'REVIEWED & CERTIFIED BY:',
      name: 'JUNIE T. ELMIDO',
      title: 'Municipal / Technical Officer'
    },
    {
      id: 'sig-3',
      roleLabel: 'NOTED & APPROVED BY:',
      name: 'HON. LEMUEL D. HONRADO',
      title: 'Municipal Mayor'
    }
  ];

  const activeSignatories =
    signatories && signatories.length > 0 ? signatories : defaultSignatories;

  const sigCellWidthPct = Math.floor(100 / activeSignatories.length);

  const sigCells = activeSignatories.map(
    (sig) =>
      new TableCell({
        children: [
          // 1. Role Label
          new Paragraph({
            children: [
              new TextRun({
                text: (sig.roleLabel || 'PREPARED & VERIFIED BY:').toUpperCase(),
                bold: true,
                size: 16,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER,
            keepNext: true
          }),
          // 2. Physical Pen Sign Spacing (blank vertical space for manual pen signing)
          new Paragraph({
            text: '',
            spacing: { before: 480, after: 60 },
            keepNext: true
          }),
          // 3. Underlined Signatory Name
          new Paragraph({
            children: [
              new TextRun({
                text: sig.name ? sig.name.toUpperCase() : '___________________________',
                bold: true,
                size: 17,
                font: 'Arial',
                underline: { type: UnderlineType.SINGLE }
              })
            ],
            alignment: AlignmentType.CENTER,
            keepNext: true
          }),
          // 4. Designation / Title
          new Paragraph({
            children: [
              new TextRun({
                text: sig.title ? sig.title.toUpperCase() : 'SIGNATURE OVER PRINTED NAME / DESIGNATION',
                bold: true,
                size: 14,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER
          })
        ],
        borders: noBorders,
        width: { size: sigCellWidthPct, type: WidthType.PERCENTAGE },
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        verticalAlign: VerticalAlign.TOP
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: pageProps
        },
        children: [
          // 1. Official Government Logos Header (3 logos clustered centered at top with locked 65px dimensions)
          headerLogosParagraph,

          // 2. Official Agency Hierarchy Text (Centered directly under logos)
          ...letterheadParagraphs,

          // 3. Document Title & Subtitle with Jurisdiction
          new Paragraph({
            children: [
              new TextRun({
                text: 'OFFICIAL MASTERLIST OF RSBSA-REGISTERED RICE FARMERS & GIS-MAPPED AGRICULTURAL LANDHOLDINGS',
                bold: true,
                size: 21,
                font: 'Times New Roman'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 30 },
            keepNext: true
          }),
          new Paragraph({
            children: [
              new TextRun({
                text:
                  selectedBarangay === 'ALL'
                    ? 'CONSOLIDATED REGISTRY - ALL SILAGO BARANGAYS'
                    : selectedBarangay === 'ASSIGNED_10'
                    ? 'CONSOLIDATED REGISTRY - 10 ASSIGNED RICE BARANGAYS'
                    : `BARANGAY ${selectedBarangay.toUpperCase()}, SILAGO, SOUTHERN LEYTE`,
                bold: true,
                size: 18,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 30 },
            keepNext: true
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Ref No: ${memoRef}  •  Date: ${reportDate}  •  Total RSBSA Records: ${parcels.length}  •  Total Registered Area: ${totalArea.toFixed(2)} ha`,
                italics: true,
                size: 16,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            keepNext: true
          }),

          // 4. Registry Table with Dynamic Pagination & Repeated Headers
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          }),

          // 5. Clean 3-Column Signatures Section at the Bottom Pinned Flush to 0.5" Bottom Margin
          new Paragraph({
            text: '',
            spacing: {
              before: (() => {
                const isLandscape = pageProps.size.orientation === 'landscape';
                const pageHeightTwips = pageProps.size.height || (isLandscape ? 12240 : 18720);
                const availablePageHeightTwips = pageHeightTwips - 1440; // 0.5" top and 0.5" bottom margin
                const headerEstimate = 2400;
                const signatureHeightTwips = 1600;
                const rowHeightTwips = 320;
                const maxRowsPerPage = Math.max(12, Math.floor((availablePageHeightTwips - headerEstimate) / rowHeightTwips));
                const totalRowsCount = tableRows.length;
                const rowsOnLastPage = totalRowsCount > maxRowsPerPage ? (totalRowsCount % maxRowsPerPage) || maxRowsPerPage : totalRowsCount;
                const usedOnLastPageTwips = (totalRowsCount <= maxRowsPerPage ? headerEstimate : 0) + (rowsOnLastPage * rowHeightTwips);
                const remainingSpaceOnLastPage = availablePageHeightTwips - usedOnLastPageTwips - signatureHeightTwips;
                return Math.max(300, Math.min(remainingSpaceOnLastPage - 300, 7500));
              })()
            },
            keepNext: true
          }),
          new Table({
            rows: [new TableRow({ children: sigCells, cantSplit: true })],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const safeBrgy = (selectedBarangay || 'Silago').replace(/\s+/g, '_');
  downloadBlob(blob, `Masterlist_Registry_${safeBrgy}.docx`);
};

export const exportMpcsrsWord = async (data: MpcsrsReportData, options?: DocxPageOptions) => {
  const pageProps = getPageDimensions({ orientation: 'landscape', ...options });
  const [daBytes, silagoBytes, bagOngSilagoBytes, bagongPilipinasBytes] = await Promise.all([
    generateDepartmentOfAgriculturePng(),
    generateSilagoSealPng(),
    generateBagOngSilagoPng(),
    generateBagongPilipinasPng()
  ]);

  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  const noBorders = {
    top: borderNone,
    bottom: borderNone,
    left: borderNone,
    right: borderNone
  };

  const headerLogosParagraph = createOfficialHeaderLogosParagraph(
    daBytes,
    silagoBytes,
    bagOngSilagoBytes || bagongPilipinasBytes,
    { sizePt: 65 }
  );

  const letterheadParagraphs = createOfficialLetterheadParagraphs({
    country: 'Republic of the Philippines',
    province: 'Province of Southern Leyte',
    municipality: 'MUNICIPALITY OF SILAGO',
    office: 'MUNICIPAL AGRICULTURE OFFICE'
  });

  const cellBorderDef = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const cellBorders = { top: cellBorderDef, bottom: cellBorderDef, left: cellBorderDef, right: cellBorderDef };
  const cellMargins = { top: 60, bottom: 60, left: 80, right: 80 };

  const headerCells = [
    'NO.',
    'BARANGAY',
    'VALIDATED AREA (ha)',
    'NEWLY PLANTED (ha)',
    'VEGETATIVE (ha)',
    'REPRODUCTIVE (ha)',
    'MATURING (ha)',
    'TECHNICIAN'
  ].map(
    (label) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 16, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        borders: cellBorders,
        margins: cellMargins,
        shading: { fill: 'F8FAFC' },
        verticalAlign: VerticalAlign.CENTER
      })
  );

  const tableRows = [new TableRow({ children: headerCells, tableHeader: true, cantSplit: true })];

  let itemIdx = 1;
  data.groups.forEach((grp) => {
    grp.rows.forEach((row, rIdx) => {
      tableRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              children: [new Paragraph({ text: String(itemIdx++), alignment: AlignmentType.CENTER })],
              borders: cellBorders,
              margins: cellMargins,
              shading: rIdx % 2 === 1 ? { fill: 'FAFAFA' } : undefined
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: row.barangay, bold: true })], alignment: AlignmentType.LEFT })],
              borders: cellBorders,
              margins: cellMargins,
              shading: rIdx % 2 === 1 ? { fill: 'FAFAFA' } : undefined
            }),
            new TableCell({
              children: [new Paragraph({ text: row.validatedAreaHa ? String(row.validatedAreaHa) : '0.00', alignment: AlignmentType.RIGHT })],
              borders: cellBorders,
              margins: cellMargins,
              shading: rIdx % 2 === 1 ? { fill: 'FAFAFA' } : undefined
            }),
            new TableCell({
              children: [new Paragraph({ text: row.newlyPlantedHa ? String(row.newlyPlantedHa) : '0.00', alignment: AlignmentType.RIGHT })],
              borders: cellBorders,
              margins: cellMargins,
              shading: rIdx % 2 === 1 ? { fill: 'FAFAFA' } : undefined
            }),
            new TableCell({
              children: [new Paragraph({ text: row.vegetativeStageHa ? String(row.vegetativeStageHa) : '0.00', alignment: AlignmentType.RIGHT })],
              borders: cellBorders,
              margins: cellMargins,
              shading: rIdx % 2 === 1 ? { fill: 'FAFAFA' } : undefined
            }),
            new TableCell({
              children: [new Paragraph({ text: row.reproductiveStageHa ? String(row.reproductiveStageHa) : '0.00', alignment: AlignmentType.RIGHT })],
              borders: cellBorders,
              margins: cellMargins,
              shading: rIdx % 2 === 1 ? { fill: 'FAFAFA' } : undefined
            }),
            new TableCell({
              children: [new Paragraph({ text: row.maturingStageHa ? String(row.maturingStageHa) : '0.00', alignment: AlignmentType.RIGHT })],
              borders: cellBorders,
              margins: cellMargins,
              shading: rIdx % 2 === 1 ? { fill: 'FAFAFA' } : undefined
            }),
            new TableCell({
              children: [new Paragraph({ text: grp.technicianName || '', alignment: AlignmentType.LEFT })],
              borders: cellBorders,
              margins: cellMargins,
              shading: rIdx % 2 === 1 ? { fill: 'FAFAFA' } : undefined
            })
          ]
        })
      );
    });
  });

  const sigs =
    data.signatories && data.signatories.length > 0
      ? data.signatories
      : [
          {
            id: 'sig-1',
            roleLabel: 'PREPARED BY:',
            name: data.preparedByName || 'WELLA S. BONGON',
            title: data.preparedByTitle || 'Agricultural Technologist / MPCSRS Focal'
          },
          {
            id: 'sig-2',
            roleLabel: 'APPROVED BY:',
            name: data.approvedByName || 'CAREIN M. TOMOL',
            title: data.approvedByTitle || 'Municipal Agriculturist / MAO-OIC'
          }
        ];

  const sigCells = sigs.map(
    (sig) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: sig.roleLabel.toUpperCase(), bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            keepNext: true
          }),
          new Paragraph({ text: '', spacing: { before: 450, after: 60 }, keepNext: true }),
          new Paragraph({
            children: [
              new TextRun({
                text: sig.name ? sig.name.toUpperCase() : '___________________________',
                bold: true,
                size: 18,
                font: 'Arial',
                underline: { type: UnderlineType.SINGLE }
              })
            ],
            alignment: AlignmentType.CENTER,
            keepNext: true
          }),
          new Paragraph({
            children: [new TextRun({ text: sig.title ? sig.title.toUpperCase() : '', size: 15, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        borders: noBorders,
        width: { size: Math.floor(100 / sigs.length), type: WidthType.PERCENTAGE },
        margins: { top: 100, bottom: 100, left: 100, right: 100 }
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: { page: pageProps },
        children: [
          // 1. Official Government Logos Header (3 logos clustered centered at top with locked 65px dimensions)
          headerLogosParagraph,

          // 2. Official Agency Hierarchy Text (Centered directly under logos)
          ...letterheadParagraphs,

          // 3. Document Title & Subtitle with Jurisdiction
          new Paragraph({
            children: [
              new TextRun({
                text: 'MONTHLY PALAY AND CORN SITUATION REPORTING SYSTEM (MPCSRS)',
                bold: true,
                size: 22,
                font: 'Times New Roman'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 30 },
            keepNext: true
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Region: ${data.region}   |   Province: Southern Leyte   |   Municipality: ${data.municipalityProvince}   |   Total Validated Area: ${data.totalValidatedAreaHa.toFixed(2)} ha`,
                italics: true,
                size: 17,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            keepNext: true
          }),

          // 4. Executive Standing Crop Summary Paragraph
          new Paragraph({
            children: [
              new TextRun({
                text: `Executive Standing Crop Summary: This official municipal standing palay report presents validated rice ecosystem hectarages covering irrigated and rainfed areas across Silago's agricultural zones. Standing crop status is recorded across Newly Planted / Seedling, Vegetative, Reproductive, and Maturing stages pursuant to Department of Agriculture national crop estimation guidelines.`,
                size: 18,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 140 },
            keepNext: true
          }),

          // 5. Metrics Table
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          }),

          // 6. Signatories Pinned Spacer & Signatures Table
          new Paragraph({
            text: '',
            spacing: {
              before: (() => {
                const isLandscape = pageProps.size.orientation === 'landscape';
                const pageHeightTwips = pageProps.size.height || (isLandscape ? 12240 : 18720);
                const availablePageHeightTwips = pageHeightTwips - 1440;
                const contentEstimate = 2800 + tableRows.length * 340;
                const signatureHeightTwips = 1600;
                const remainingMpcsrsSpace = availablePageHeightTwips - contentEstimate - signatureHeightTwips;
                return Math.max(300, Math.min(remainingMpcsrsSpace - 300, 6000));
              })()
            },
            keepNext: true
          }),
          new Table({
            rows: [new TableRow({ children: sigCells, cantSplit: true })],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'MPCSRS_Palay_Report_Silago.docx');
};

export const exportIrrigatorsWord = async (data: IrrigatorsDirectoryLetterData, options?: DocxPageOptions) => {
  const pageProps = getPageDimensions({ orientation: 'portrait', ...options });
  const [daBytes, silagoBytes, bagOngSilagoBytes, bagongPilipinasBytes] = await Promise.all([
    generateDepartmentOfAgriculturePng(),
    generateSilagoSealPng(),
    generateBagOngSilagoPng(),
    generateBagongPilipinasPng()
  ]);

  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  const noBorders = {
    top: borderNone,
    bottom: borderNone,
    left: borderNone,
    right: borderNone
  };

  const headerLogosParagraph = createOfficialHeaderLogosParagraph(
    daBytes,
    silagoBytes,
    bagOngSilagoBytes || bagongPilipinasBytes,
    { sizePt: 65 }
  );

  const letterheadParagraphs = createOfficialLetterheadParagraphs({
    country: data.republicHeader || 'Republic of the Philippines',
    province: data.provinceHeader || 'Province of Southern Leyte',
    municipality: data.municipalityHeader || 'MUNICIPALITY OF SILAGO',
    office: data.officeHeader || 'OFFICE OF THE MUNICIPAL AGRICULTURIST'
  });

  const cellBorderDef = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const cellBorders = { top: cellBorderDef, bottom: cellBorderDef, left: cellBorderDef, right: cellBorderDef };
  const cellMargins = { top: 60, bottom: 60, left: 80, right: 80 };

  const headerCells = ['NO.', 'NAME OF IRRIGATORS ASSOCIATION', 'CONTACT PERSON', 'BARANGAY'].map(
    (label) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 16, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        borders: cellBorders,
        margins: cellMargins,
        shading: { fill: 'F8FAFC' },
        verticalAlign: VerticalAlign.CENTER
      })
  );

  const tableRows = [new TableRow({ children: headerCells, tableHeader: true, cantSplit: true })];

  data.associations.forEach((assoc, i) => {
    tableRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            children: [new Paragraph({ text: String(i + 1), alignment: AlignmentType.CENTER })],
            borders: cellBorders,
            margins: cellMargins
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: assoc.associationName, bold: true })], alignment: AlignmentType.LEFT })],
            borders: cellBorders,
            margins: cellMargins
          }),
          new TableCell({
            children: [new Paragraph({ text: assoc.contactPerson, alignment: AlignmentType.LEFT })],
            borders: cellBorders,
            margins: cellMargins
          }),
          new TableCell({
            children: [new Paragraph({ text: assoc.barangay, alignment: AlignmentType.CENTER })],
            borders: cellBorders,
            margins: cellMargins
          })
        ]
      })
    );
  });

  const sigs =
    data.signatories && data.signatories.length > 0
      ? data.signatories
      : [
          {
            id: 'sig-1',
            roleLabel: 'PREPARED BY:',
            name: data.preparedByName || 'WELLA S. BONGON',
            title: data.preparedByTitle || 'Agricultural Technologist / Rice Focal'
          },
          {
            id: 'sig-2',
            roleLabel: 'NOTED BY:',
            name: data.notedByName || 'CAREIN M. TOMOL',
            title: data.notedByTitle || 'Municipal Agriculturist / MAO-OIC'
          }
        ];

  const sigCells = sigs.map(
    (sig) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: sig.roleLabel.toUpperCase(), bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            keepNext: true
          }),
          new Paragraph({ text: '', spacing: { before: 450, after: 60 }, keepNext: true }),
          new Paragraph({
            children: [
              new TextRun({
                text: sig.name ? sig.name.toUpperCase() : '___________________________',
                bold: true,
                size: 18,
                font: 'Arial',
                underline: { type: UnderlineType.SINGLE }
              })
            ],
            alignment: AlignmentType.CENTER,
            keepNext: true
          }),
          new Paragraph({
            children: [new TextRun({ text: sig.title ? sig.title.toUpperCase() : '', size: 15, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        borders: noBorders,
        width: { size: Math.floor(100 / sigs.length), type: WidthType.PERCENTAGE },
        margins: { top: 100, bottom: 100, left: 100, right: 100 }
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: { page: pageProps },
        children: [
          // 1. Official Government Logos Header (3 logos clustered centered at top with locked 65px dimensions)
          headerLogosParagraph,

          // 2. Official Agency Hierarchy Text (Centered directly under logos)
          ...letterheadParagraphs,

          // 3. Document Title & Subtitle with Jurisdiction
          new Paragraph({
            children: [
              new TextRun({
                text: 'DIRECTORY OF IRRIGATORS ASSOCIATIONS & RICE PRODUCTION OVERVIEW',
                bold: true,
                size: 21,
                font: 'Times New Roman'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 30 },
            keepNext: true
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Irrigated: ${data.totalIrrigatedAreaHa} ha   |   Total Rainfed: ${data.totalRainfedAreaHa} ha   |   Registered Rice Farmers: ${data.totalRiceFarmersCount}`,
                italics: true,
                size: 17,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            keepNext: true
          }),

          // 4. Executive Narrative Summary Paragraph
          new Paragraph({
            children: [
              new TextRun({
                text: `Overview & Administrative Masterlist: This official directory documents the legitimate Irrigators Associations (IAs) and agricultural water-user collectives registered within the Municipality of Silago, Southern Leyte. Organized in close coordination with the National Irrigation Administration (NIA) and the Department of Agriculture, these associations manage communal irrigation systems, lateral canals, and water distribution schedules vital to sustaining seasonal palay yields.`,
                size: 18,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 140 },
            keepNext: true
          }),

          // 5. Metrics Table
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          }),

          // 6. Signatories Pinned Spacer & Signatures Table
          new Paragraph({
            text: '',
            spacing: {
              before: (() => {
                const pageHeightTwips = pageProps.size.height || 18720;
                const availablePageHeightTwips = pageHeightTwips - 1440;
                const contentEstimate = 2800 + 1600 + (tableRows.length * 360);
                const signatureHeightTwips = 1600;
                const remainingIrrigatorsSpace = availablePageHeightTwips - contentEstimate - signatureHeightTwips;
                return Math.max(300, Math.min(remainingIrrigatorsSpace - 300, 7500));
              })()
            },
            keepNext: true
          }),
          new Table({
            rows: [new TableRow({ children: sigCells, cantSplit: true })],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'Irrigators_Directory_Silago.docx');
};

export const exportLetterWord = async (
  letter: OfficialReportLetter,
  signatories: OfficialSignatory[],
  options?: DocxPageOptions
) => {
  const pageProps = getPageDimensions({ orientation: 'portrait', ...options });
  const [daBytes, silagoBytes, bagOngSilagoBytes, bagongPilipinasBytes] = await Promise.all([
    generateDepartmentOfAgriculturePng(),
    generateSilagoSealPng(),
    generateBagOngSilagoPng(),
    generateBagongPilipinasPng()
  ]);

  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  const noBorders = {
    top: borderNone,
    bottom: borderNone,
    left: borderNone,
    right: borderNone
  };

  const headerLogosParagraph = createOfficialHeaderLogosParagraph(
    daBytes,
    silagoBytes,
    bagOngSilagoBytes || bagongPilipinasBytes,
    { sizePt: 65 }
  );

  const letterheadParagraphs = createOfficialLetterheadParagraphs({
    country: letter.republicHeader || 'Republic of the Philippines',
    province: letter.provinceHeader || 'Province of Southern Leyte',
    municipality: letter.municipalityHeader || 'MUNICIPALITY OF SILAGO',
    office: letter.officeHeader || 'OFFICE OF THE MUNICIPAL AGRICULTURIST'
  });

  const sigs = letter.signatories && letter.signatories.length > 0 ? letter.signatories : signatories;

  const sigCells = sigs.map(
    (sig) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: sig.roleLabel.toUpperCase(), bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            keepNext: true
          }),
          new Paragraph({ text: '', spacing: { before: 450, after: 60 }, keepNext: true }),
          new Paragraph({
            children: [
              new TextRun({
                text: sig.name ? sig.name.toUpperCase() : '___________________________',
                bold: true,
                size: 18,
                font: 'Arial',
                underline: { type: UnderlineType.SINGLE }
              })
            ],
            alignment: AlignmentType.CENTER,
            keepNext: true
          }),
          new Paragraph({
            children: [new TextRun({ text: sig.title ? sig.title.toUpperCase() : '', size: 15, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        borders: noBorders,
        width: { size: Math.floor(100 / sigs.length), type: WidthType.PERCENTAGE },
        margins: { top: 100, bottom: 100, left: 100, right: 100 }
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: { page: pageProps },
        children: [
          // 1. Official Government Logos Header (3 logos clustered centered at top with locked 65px dimensions)
          headerLogosParagraph,

          // 2. Official Agency Hierarchy Text (Centered directly under logos)
          ...letterheadParagraphs,

          new Paragraph({
            children: [
              new TextRun({ text: `MEMORANDUM REF: ${letter.memoRef || 'SLG-MAO-2024'}`, bold: true, size: 18 }),
              new TextRun({ text: `\t\t\t\t\t\tDate: ${letter.date || ''}`, bold: true, size: 18 })
            ],
            spacing: { before: 80, after: 150 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'FOR:\t\t', bold: true }),
              new TextRun({ text: `${letter.memorandumFor}\n\t\t${letter.memorandumForTitle}`, bold: true })
            ],
            spacing: { after: 150 }
          }),
          ...(letter.thru
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'THRU:\t\t', bold: true }),
                    new TextRun({ text: `${letter.thru} (${letter.thruTitle || ''})`, bold: true })
                  ],
                  spacing: { after: 150 }
                })
              ]
            : []),
          new Paragraph({
            children: [
              new TextRun({ text: 'FROM:\t\t', bold: true }),
              new TextRun({ text: `${letter.from} (${letter.fromTitle})`, bold: true })
            ],
            spacing: { after: 150 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'SUBJECT:\t', bold: true }),
              new TextRun({ text: letter.subject, bold: true, underline: { type: UnderlineType.SINGLE } })
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [new TextRun({ text: letter.openingGreeting || 'Sir/Madam:', size: 20 })],
            spacing: { after: 150 }
          }),
          new Paragraph({
            children: [new TextRun({ text: letter.bodyParagraph1 || '', size: 20 })],
            spacing: { after: 150 }
          }),
          new Paragraph({
            children: [new TextRun({ text: letter.bodyParagraph2 || '', size: 20 })],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [new TextRun({ text: letter.closingStatement || 'Respectfully submitted,', size: 20 })],
            spacing: { after: 120 },
            keepNext: true
          }),
          new Paragraph({
            text: '',
            spacing: {
              before: (() => {
                const pageHeightTwips = pageProps.size.height || 18720;
                const availablePageHeightTwips = pageHeightTwips - 1440; // 0.5" margins
                const contentEstimate =
                  2400 + // Header logos & texts
                  1800 + // Memo headers
                  (letter.bodyParagraph1?.length || 0) * 3 +
                  (letter.bodyParagraph2?.length || 0) * 3 +
                  1000;
                const signatureHeightTwips = 1600;
                const remainingLetterSpace = availablePageHeightTwips - contentEstimate - signatureHeightTwips;
                return Math.max(300, Math.min(remainingLetterSpace - 300, 7500));
              })()
            },
            keepNext: true
          }),
          new Table({
            rows: [new TableRow({ children: sigCells, cantSplit: true })],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'Transmittal_Letter_Silago.docx');
};

// ==========================================
// COMPLETE PACKAGE EXPORT (ALL 4 REPORTS)
// ==========================================

export const exportCompletePackageExcel = (
  parcels: FarmParcel[],
  visibleColumns: Record<string, boolean>,
  selectedBarangay: string,
  reportDate: string,
  memoRef: string,
  signatories: OfficialSignatory[],
  letter: OfficialReportLetter,
  irrigatorsData: IrrigatorsDirectoryLetterData,
  mpcsrsData: MpcsrsReportData
) => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Transmittal Letter
  const letterRows: (string | number)[][] = [
    ['REPUBLIC OF THE PHILIPPINES'],
    ['PROVINCE OF SOUTHERN LEYTE'],
    ['MUNICIPALITY OF SILAGO'],
    ['OFFICE OF THE MUNICIPAL AGRICULTURIST'],
    [''],
    ['OFFICIAL TRANSMITTAL MEMORANDUM'],
    [`MEMO REF: ${letter.memoRef || memoRef}`, '', `DATE: ${letter.date || reportDate}`],
    [''],
    ['FOR:', `${letter.memorandumFor} (${letter.memorandumForTitle})`],
    ...(letter.thru ? [['THRU:', `${letter.thru} (${letter.thruTitle || ''})`]] : []),
    ['FROM:', `${letter.from} (${letter.fromTitle})`],
    ['SUBJECT:', letter.subject],
    [''],
    [letter.openingGreeting || 'Sir/Madam:'],
    [''],
    [letter.bodyParagraph1 || ''],
    [''],
    [letter.bodyParagraph2 || ''],
    [''],
    [letter.closingStatement || 'Respectfully submitted,'],
    [''],
    ['SIGNATORIES:']
  ];

  const letterSigs = letter.signatories && letter.signatories.length > 0 ? letter.signatories : signatories;
  letterSigs.forEach((sig) => {
    letterRows.push([sig.roleLabel, sig.name ? sig.name.toUpperCase() : '', sig.title ? sig.title.toUpperCase() : '']);
  });

  const wsLetter = XLSX.utils.aoa_to_sheet(letterRows);
  wsLetter['!cols'] = [{ wch: 18 }, { wch: 45 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsLetter, '1-Transmittal Letter');

  // 2. Sheet: Irrigators Directory
  const irrRows: (string | number)[][] = [
    ['REPUBLIC OF THE PHILIPPINES'],
    ['PROVINCE OF SOUTHERN LEYTE'],
    ['MUNICIPALITY OF SILAGO'],
    ['OFFICE OF THE MUNICIPAL AGRICULTURIST'],
    [''],
    ['DIRECTORY OF REGISTERED IRRIGATORS ASSOCIATIONS (IA)'],
    [`MUNICIPALITY: SILAGO, SOUTHERN LEYTE | DATE: ${reportDate}`],
    [''],
    [
      'NO.',
      'ASSOCIATION NAME',
      'BARANGAY LOCATION',
      'CONTACT PERSON / PRESIDENT'
    ]
  ];

  irrigatorsData.associations.forEach((assoc, i) => {
    irrRows.push([
      i + 1,
      assoc.associationName,
      assoc.barangay,
      assoc.contactPerson || ''
    ]);
  });

  irrRows.push(['']);
  irrRows.push(['', 'TOTAL MUNICIPAL IRRIGATED AREA (ha):', irrigatorsData.totalIrrigatedAreaHa.toFixed(2)]);
  irrRows.push(['', 'TOTAL RAINFED AREA (ha):', irrigatorsData.totalRainfedAreaHa.toFixed(2)]);
  irrRows.push(['', 'TOTAL REGISTERED RICE FARMERS:', irrigatorsData.totalRiceFarmersCount]);
  irrRows.push(['']);
  irrRows.push(['OFFICIAL SIGNATORIES:']);

  const irrSigs = irrigatorsData.signatories && irrigatorsData.signatories.length > 0 ? irrigatorsData.signatories : signatories;
  irrSigs.forEach((sig) => {
    irrRows.push([sig.roleLabel, sig.name ? sig.name.toUpperCase() : '', sig.title ? sig.title.toUpperCase() : '']);
  });

  const wsIrr = XLSX.utils.aoa_to_sheet(irrRows);
  wsIrr['!cols'] = [{ wch: 6 }, { wch: 55 }, { wch: 22 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsIrr, '2-Irrigators Directory');

  // 3. Sheet: MPCSRS Palay Report
  const mpcsrsRows: (string | number)[][] = [
    ['MONTHLY PALAY AND CORN SITUATION REPORTING SYSTEM (MPCSRS)'],
    [`REGION: ${mpcsrsData.region} | MUNICIPALITY: ${mpcsrsData.municipalityProvince}`],
    [`DATE / REFERENCE: ${reportDate} | MEMO REF: ${memoRef}`],
    [''],
    [
      'NO.',
      'BARANGAY',
      'VALIDATED AREA (ha)',
      'NEWLY PLANTED (ha)',
      'VEGETATIVE STAGE (ha)',
      'REPRODUCTIVE STAGE (ha)',
      'MATURING STAGE (ha)',
      'TECHNICIAN IN CHARGE'
    ]
  ];

  let mpIdx = 1;
  mpcsrsData.groups.forEach((grp) => {
    grp.rows.forEach((row) => {
      mpcsrsRows.push([
        mpIdx++,
        row.barangay,
        row.validatedAreaHa || '',
        row.newlyPlantedHa || '',
        row.vegetativeStageHa || '',
        row.reproductiveStageHa || '',
        row.maturingStageHa || '',
        grp.technicianName || ''
      ]);
    });
    if (grp.subtotalAreaHa) {
      mpcsrsRows.push(['', 'SUB-TOTAL:', grp.subtotalAreaHa, '', '', '', '', `Tech: ${grp.technicianName || ''}`]);
    }
  });

  mpcsrsRows.push(['']);
  mpcsrsRows.push(['GRAND TOTAL VALIDATED AREA (ha):', '', mpcsrsData.totalValidatedAreaHa]);
  mpcsrsRows.push(['']);
  mpcsrsRows.push(['OFFICIAL SIGNATORIES:']);

  const mpSigs = mpcsrsData.signatories && mpcsrsData.signatories.length > 0 ? mpcsrsData.signatories : signatories;
  mpSigs.forEach((sig) => {
    mpcsrsRows.push([sig.roleLabel, sig.name ? sig.name.toUpperCase() : '', sig.title ? sig.title.toUpperCase() : '']);
  });

  const wsMpcsrs = XLSX.utils.aoa_to_sheet(mpcsrsRows);
  wsMpcsrs['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsMpcsrs, '3-MPCSRS Palay');

  // 4. Sheet: RSBSA Masterlist Registry
  const colKeys = [
    'rsbsaNo',
    'familyName',
    'givenName',
    'middleName',
    'barangay',
    'municipality',
    'province',
    'birthday',
    'farmLocation',
    'latitude',
    'longitude',
    'farmArea',
    'commodity'
  ].filter((k) => visibleColumns[k] !== false);

  const headerLabels: Record<string, string> = {
    rsbsaNo: 'RSBSA NO.',
    familyName: 'FAMILY NAME',
    givenName: 'GIVEN NAME',
    middleName: 'MIDDLE NAME',
    barangay: 'BARANGAY',
    municipality: 'MUNICIPALITY',
    province: 'PROVINCE',
    birthday: 'BIRTHDAY',
    farmLocation: 'FARM LOCATION',
    latitude: 'LATITUDE',
    longitude: 'LONGITUDE',
    farmArea: 'FARM AREA (ha)',
    commodity: 'COMMODITY PLANTED'
  };

  const regRows: (string | number)[][] = [
    ['REPUBLIC OF THE PHILIPPINES'],
    ['PROVINCE OF SOUTHERN LEYTE'],
    ['MUNICIPALITY OF SILAGO'],
    ['OFFICE OF THE MUNICIPAL AGRICULTURIST'],
    [''],
    ['RSBSA RICE FARM MASTERLIST & GIS LANDHOLDINGS REGISTRY'],
    [`COVERAGE: ${selectedBarangay === 'ALL' ? 'ALL BARANGAYS' : `BARANGAY ${selectedBarangay.toUpperCase()}`}`],
    [`DATE ISSUED: ${reportDate} | MEMO REF: ${memoRef}`],
    [''],
    colKeys.map((k) => headerLabels[k])
  ];

  let totalArea = 0;
  parcels.forEach((p) => {
    const { family, given, middle } = parseFarmerName(p);
    const bday = formatBday(p.birthday);
    const farmLoc = p.purok
      ? `${p.purok}, Brgy. ${getDisplayBarangay(p.barangay)}`
      : `Brgy. ${getDisplayBarangay(p.barangay)}`;
    const area = Number(p.weightKg || 0);
    totalArea += area;

    const rowObj: Record<string, string | number> = {
      rsbsaNo: p.swineNameOrId || '',
      familyName: family,
      givenName: given,
      middleName: middle,
      barangay: getDisplayBarangay(p.barangay),
      municipality: 'SILAGO',
      province: 'SOUTHERN LEYTE',
      birthday: bday,
      farmLocation: farmLoc.toUpperCase(),
      latitude: p.lat ? p.lat.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : '',
      longitude: p.lng ? p.lng.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : '',
      farmArea: area > 0 ? area : '',
      commodity: (p.commodity || 'RICE').toUpperCase()
    };

    regRows.push(colKeys.map((k) => rowObj[k]));
  });

  regRows.push(['']);
  const summaryRow = colKeys.map((k) => {
    if (k === colKeys[0]) return 'TOTAL RECORD COUNT: ' + parcels.length;
    if (k === 'farmArea') return `TOTAL AREA: ${totalArea.toFixed(2)} ha`;
    return '';
  });
  regRows.push(summaryRow);

  regRows.push(['']);
  regRows.push(['OFFICIAL CERTIFICATION & SIGNATURES:']);

  signatories.forEach((sig) => {
    regRows.push([sig.roleLabel, sig.name ? sig.name.toUpperCase() : '', sig.title ? sig.title.toUpperCase() : '']);
  });

  const wsReg = XLSX.utils.aoa_to_sheet(regRows);
  wsReg['!cols'] = colKeys.map((k) => ({
    wch: k === 'rsbsaNo' ? 22 : k === 'farmLocation' ? 25 : k === 'familyName' || k === 'givenName' ? 18 : 14
  }));
  XLSX.utils.book_append_sheet(wb, wsReg, '4-Masterlist Registry');

  const safeBrgy = (selectedBarangay || 'Silago').replace(/\s+/g, '_');
  XLSX.writeFile(wb, `Complete_Package_Dossier_Silago_${safeBrgy}.xlsx`);
};

export const exportCompletePackageWord = async (
  parcels: FarmParcel[],
  visibleColumns: Record<string, boolean>,
  selectedBarangay: string,
  reportDate: string,
  memoRef: string,
  signatories: OfficialSignatory[],
  letter: OfficialReportLetter,
  irrigatorsData: IrrigatorsDirectoryLetterData,
  mpcsrsData: MpcsrsReportData,
  options?: DocxPageOptions
) => {
  const [daBytes, silagoBytes, bagOngSilagoBytes, bagongPilipinasBytes] = await Promise.all([
    generateDepartmentOfAgriculturePng(),
    generateSilagoSealPng(),
    generateBagOngSilagoPng(),
    generateBagongPilipinasPng()
  ]);

  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  const noBorders = {
    top: borderNone,
    bottom: borderNone,
    left: borderNone,
    right: borderNone
  };

  const portraitProps = getPageDimensions({ orientation: 'portrait', ...options });
  const landscapeProps = getPageDimensions({ orientation: 'landscape', ...options });

  // 1. SECTION 1: Transmittal Letter
  const headerLogosPortrait = createOfficialHeaderLogosParagraph(
    daBytes,
    silagoBytes,
    bagOngSilagoBytes || bagongPilipinasBytes,
    { sizePt: 65 }
  );

  const letterheadParagraphs = createOfficialLetterheadParagraphs({
    country: letter.republicHeader || 'Republic of the Philippines',
    province: letter.provinceHeader || 'Province of Southern Leyte',
    municipality: letter.municipalityHeader || 'MUNICIPALITY OF SILAGO',
    office: letter.officeHeader || 'OFFICE OF THE MUNICIPAL AGRICULTURIST'
  });

  const letterSigs = letter.signatories && letter.signatories.length > 0 ? letter.signatories : signatories;
  const letterSigCells = letterSigs.map(
    (sig) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: sig.roleLabel.toUpperCase(), bold: true, size: 17, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            keepNext: true
          }),
          new Paragraph({ text: '', spacing: { before: 450, after: 60 }, keepNext: true }),
          new Paragraph({
            children: [
              new TextRun({
                text: sig.name ? sig.name.toUpperCase() : '___________________________',
                bold: true,
                size: 18,
                font: 'Arial',
                underline: { type: UnderlineType.SINGLE }
              })
            ],
            alignment: AlignmentType.CENTER,
            keepNext: true
          }),
          new Paragraph({
            children: [new TextRun({ text: sig.title ? sig.title.toUpperCase() : '', size: 15, font: 'Arial' })],
            alignment: AlignmentType.CENTER
          })
        ],
        borders: noBorders,
        width: { size: Math.floor(100 / letterSigs.length), type: WidthType.PERCENTAGE }
      })
  );

  const section1Children = [
    headerLogosPortrait,
    ...letterheadParagraphs,
    new Paragraph({
      children: [
        new TextRun({ text: `MEMORANDUM REF: ${letter.memoRef || memoRef}`, bold: true, size: 18 }),
        new TextRun({ text: `\t\t\t\t\t\tDate: ${letter.date || reportDate}`, bold: true, size: 18 })
      ],
      spacing: { before: 80, after: 150 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'FOR:\t\t', bold: true }),
        new TextRun({ text: `${letter.memorandumFor}\n\t\t${letter.memorandumForTitle}`, bold: true })
      ],
      spacing: { after: 150 }
    }),
    ...(letter.thru
      ? [
          new Paragraph({
            children: [
              new TextRun({ text: 'THRU:\t\t', bold: true }),
              new TextRun({ text: `${letter.thru} (${letter.thruTitle || ''})`, bold: true })
            ],
            spacing: { after: 150 }
          })
        ]
      : []),
    new Paragraph({
      children: [
        new TextRun({ text: 'FROM:\t\t', bold: true }),
        new TextRun({ text: `${letter.from} (${letter.fromTitle})`, bold: true })
      ],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'SUBJECT:\t', bold: true }),
        new TextRun({ text: letter.subject, bold: true, underline: { type: UnderlineType.SINGLE } })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: letter.openingGreeting || 'Sir/Madam:', size: 20 })],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({ text: letter.bodyParagraph1 || '', size: 20 })],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({ text: letter.bodyParagraph2 || '', size: 20 })],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: letter.closingStatement || 'Respectfully submitted,', size: 20 })],
      spacing: { after: 120 },
      keepNext: true
    }),
    new Paragraph({
      text: '',
      spacing: { before: 800 },
      keepNext: true
    }),
    new Table({
      rows: [new TableRow({ children: letterSigCells, cantSplit: true })],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders
    })
  ];

  const doc = new Document({
    sections: [
      {
        properties: { page: portraitProps },
        children: section1Children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const safeBrgy = (selectedBarangay || 'Silago').replace(/\s+/g, '_');
  downloadBlob(blob, `Complete_Package_Dossier_Silago_${safeBrgy}.docx`);
};

