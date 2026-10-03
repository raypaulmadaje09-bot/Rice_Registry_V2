import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ChevronDown,
  Search,
  Check,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
  Phone
} from 'lucide-react';

interface CountryItem {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  format: string; // e.g., '### ### ####'
  digits: number;
}

const COUNTRIES: CountryItem[] = [
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', format: '### ### ####', digits: 10 },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', format: '### ### ####', digits: 10 },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', format: '#### ######', digits: 10 },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', format: '### ### ###', digits: 9 },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', format: '### ### ####', digits: 10 },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵', format: '## #### ####', digits: 10 },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', format: '#### ####', digits: 8 },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪', format: '### #######', digits: 10 },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷', format: '# ## ## ## ##', digits: 9 },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪', format: '## ### ####', digits: 9 },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦', format: '## ### ####', digits: 9 },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷', format: '## #### ####', digits: 10 },
  { name: 'Armenia', code: 'AM', dialCode: '+374', flag: '🇦🇲', format: '## ######', digits: 8 },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿', format: '## ### ####', digits: 9 },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', format: '##### #####', digits: 10 }
];

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (phoneNumber: string) => void;
  userEmail?: string;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  userEmail = 'user@example.com'
}) => {
  const { adminProfile, lftAccounts } = useApp();
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(COUNTRIES[0]); // Default Philippines (+63)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [allowSms, setAllowSms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(45);
  const [errorMessage, setErrorMessage] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Resend OTP timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCountdown]);

  if (!isOpen) return null;

  // Format phone number according to digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length > selectedCountry.digits) return;

    // Format with spaces
    let formatted = '';
    let rawIndex = 0;
    for (let i = 0; i < selectedCountry.format.length && rawIndex < raw.length; i++) {
      if (selectedCountry.format[i] === '#') {
        formatted += raw[rawIndex];
        rawIndex++;
      } else {
        formatted += selectedCountry.format[i];
      }
    }
    setPhoneNumber(formatted);
  };

  const rawDigits = phoneNumber.replace(/\D/g, '');
  const isValidPhone = rawDigits.length === selectedCountry.digits && allowSms;

  const handleSendCode = () => {
    if (!isValidPhone) return;
    setIsLoading(true);
    setErrorMessage('');

    // Check if phone number is registered in system
    const cleanNumber = rawDigits;
    const isCoordinatorNum =
      cleanNumber.includes('1200') ||
      cleanNumber.includes('0000') ||
      cleanNumber.includes('5451200') ||
      cleanNumber.includes('5554321') ||
      (adminProfile?.contactNumber && adminProfile.contactNumber.replace(/\D/g, '').endsWith(cleanNumber.slice(-7)));

    const isLftNum = lftAccounts?.some((acc) => {
      const accDigits = (acc.contactNumber || '').replace(/\D/g, '');
      return accDigits && cleanNumber && (accDigits === cleanNumber || accDigits.endsWith(cleanNumber.slice(-7)));
    });

    if (!isCoordinatorNum && !isLftNum) {
      setIsLoading(false);
      setErrorMessage(
        'Kini nga mobile number wala marehistro sa Silago Rice Registry system. Palihug pakigkita sa MAO Admin.'
      );
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      setResendCountdown(45);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }, 1000);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste
      const pasted = val.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpCode];
      pasted.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtpCode(newOtp);
      const nextIdx = Math.min(index + pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const newOtp = [...otpCode];
    newOtp[index] = val;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const code = otpCode.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
      const fullNumber = `${selectedCountry.dialCode} ${phoneNumber}`;
      if (onVerified) onVerified(fullNumber);
      setTimeout(() => {
        onClose();
        setStep('input');
        setOtpCode(['', '', '', '', '', '']);
        setPhoneNumber('');
      }, 1800);
    }, 1200);
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-black border border-neutral-800 rounded-2xl p-7 text-center shadow-2xl text-white">
        {/* Top Header Row with Minimalist Vercel Triangle & Close Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {/* Minimalist White Triangle Logo (Vercel Style) */}
            <svg
              className="w-5 h-5 fill-white"
              viewBox="0 0 76 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="white" />
            </svg>
            <span className="text-[11px] font-mono tracking-widest text-neutral-500 uppercase font-semibold">
              AUTH VERIFICATION
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 rounded-lg transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Phone Number Input View */}
        {step === 'input' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                Verification
              </h2>
              <p className="text-sm text-neutral-400 mt-2 leading-relaxed max-w-sm mx-auto">
                Please enter your phone number to verify your login. You will receive a single use code to submit.
              </p>
            </div>

            {/* Unified Phone Input Field with Country Code Selector */}
            <div className="relative text-left" ref={dropdownRef}>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                Phone Number
              </label>

              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg focus-within:border-neutral-500 transition-colors shadow-inner">
                {/* Country Code Trigger */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-200 border-r border-neutral-800 rounded-l-lg transition cursor-pointer shrink-0"
                >
                  <span className="text-lg leading-none">{selectedCountry.flag}</span>
                  <span className="text-xs font-mono text-neutral-300 font-semibold">{selectedCountry.dialCode}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                {/* Phone Number Input */}
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="912 573 1008"
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none font-mono"
                  autoFocus
                />
              </div>

              {/* Country Code Dropdown Menu List */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 p-1.5 animate-in fade-in-50 zoom-in-95">
                  {/* Search input in dropdown */}
                  <div className="relative mb-1.5 px-1 pt-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search country or code..."
                      className="w-full pl-8 pr-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                    />
                  </div>

                  {/* List items */}
                  <div className="space-y-0.5">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                          setPhoneNumber('');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          selectedCountry.code === country.code
                            ? 'bg-neutral-800 text-white font-bold'
                            : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{country.flag}</span>
                          <span className="truncate">{country.name}</span>
                        </div>
                        <span className="font-mono text-neutral-400 font-semibold">{country.dialCode}</span>
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="py-3 text-center text-xs text-neutral-500">
                        No countries found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox Security / Consent */}
            <div className="flex items-start gap-2.5 text-left pt-1">
              <input
                id="sms-consent-checkbox"
                type="checkbox"
                checked={allowSms}
                onChange={(e) => setAllowSms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-white"
              />
              <label
                htmlFor="sms-consent-checkbox"
                className="text-xs text-neutral-400 leading-snug cursor-pointer select-none"
              >
                Allow SMS delivery for verification and security authentication.
              </label>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-400 text-left bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg">
                {errorMessage}
              </p>
            )}

            {/* High-Contrast Submit Button */}
            <button
              type="button"
              onClick={handleSendCode}
              disabled={!isValidPhone || isLoading}
              className="w-full py-2.5 bg-white text-black font-medium hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-white rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-sm shadow-md"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: 6-Digit OTP Verification View */}
        {step === 'otp' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                Enter Code
              </h2>
              <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                We sent a 6-digit code to{' '}
                <span className="text-white font-mono font-bold">
                  {selectedCountry.dialCode} {phoneNumber}
                </span>
                .
              </p>
            </div>

            {/* 6-Digit OTP Input Boxes */}
            <div className="flex items-center justify-center gap-2">
              {otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-lg font-mono font-bold bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-white transition-all shadow-inner"
                />
              ))}
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg">
                {errorMessage}
              </p>
            )}

            {/* Verify Button */}
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otpCode.join('').length < 6 || isLoading}
              className="w-full py-2.5 bg-white text-black font-medium hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-white rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-sm shadow-md"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : (
                <span>Verify Code</span>
              )}
            </button>

            {/* Resend Code Action */}
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-neutral-400 hover:text-white transition cursor-pointer"
              >
                Change Phone
              </button>
              {resendCountdown > 0 ? (
                <span className="font-mono text-neutral-500">Resend in {resendCountdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setResendCountdown(45);
                    setOtpCode(['', '', '', '', '', '']);
                  }}
                  className="text-white hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend code</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Success Animation View */}
        {step === 'success' && (
          <div className="py-8 space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Phone Verified!</h2>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Your mobile number has been authenticated. You can now use SMS alerts and multi-factor security.
            </p>
          </div>
        )}

        {/* Footer Subtle Links */}
        <div className="mt-8 pt-4 border-t border-neutral-900 flex items-center justify-center gap-4 text-xs text-neutral-500">
          <a
            href="#terms"
            onClick={(e) => e.preventDefault()}
            className="hover:text-neutral-300 transition"
          >
            Terms
          </a>
          <span className="text-neutral-700">&bull;</span>
          <a
            href="#privacy"
            onClick={(e) => e.preventDefault()}
            className="hover:text-neutral-300 transition"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};
