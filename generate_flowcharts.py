import os
import shutil
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Polygon as MplPolygon
import numpy as np

font_family = 'Segoe UI'

def create_system_process_flowchart(output_path):
    fig = plt.figure(figsize=(16, 24), dpi=200, facecolor='#F8FAFC')
    ax = fig.add_subplot(111)
    ax.set_facecolor('#F8FAFC')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Color Palette
    C_HEADER_BG = '#14532D'      # Deep Forest Green
    C_START_END = '#0F766E'      # Deep Teal
    C_PROCESS = '#1E3A8A'        # Slate Blue / Navy
    C_PROCESS_BG = '#EFF6FF'     # Soft Blue Fill
    C_PROCESS_BORDER = '#3B82F6' # Vibrant Blue
    C_DECISION = '#D97706'       # Amber / Gold
    C_DECISION_BG = '#FEF3C7'    # Soft Amber Fill
    C_GIS = '#15803D'            # Emerald Green
    C_GIS_BG = '#F0FDF4'         # Soft Green Fill
    C_GIS_BORDER = '#22C55E'
    C_DB = '#7C3AED'             # Purple
    C_DB_BG = '#F5F3FF'          # Soft Purple Fill
    C_DB_BORDER = '#8B5CF6'
    C_ALERT = '#DC2626'          # Red / Alert
    C_ALERT_BG = '#FEF2F2'
    C_REPORT = '#0284C7'         # Sky Blue
    C_REPORT_BG = '#F0F9FF'
    C_ARROW = '#334155'          # Dark Slate Grey
    C_TEXT_MAIN = '#0F172A'      # Slate 900
    C_TEXT_MUTED = '#475569'     # Slate 600

    def draw_shadow(x, y, w, h, rad=1.0):
        shadow = FancyBboxPatch((x + 0.35, y - 0.35), w, h,
                                boxstyle=f"round,pad=0.2,rounding_size={rad}",
                                ec="none", fc="#CBD5E1", alpha=0.45, zorder=2)
        ax.add_patch(shadow)

    def draw_process(x, y, w, h, title, subtitle="", badge="", bg_color=C_PROCESS_BG, border_color=C_PROCESS_BORDER, text_color=C_TEXT_MAIN):
        draw_shadow(x, y, w, h, rad=0.8)
        box = FancyBboxPatch((x, y), w, h,
                             boxstyle="round,pad=0.2,rounding_size=0.8",
                             ec=border_color, fc=bg_color, lw=2.0, zorder=3)
        ax.add_patch(box)

        if badge:
            badge_w = len(badge) * 0.7 + 1.5
            badge_box = FancyBboxPatch((x + 1.2, y + h - 0.9), badge_w, 1.4,
                                       boxstyle="round,pad=0.1,rounding_size=0.4",
                                       ec="none", fc=border_color, zorder=4)
            ax.add_patch(badge_box)
            ax.text(x + 1.2 + badge_w / 2, y + h - 0.2, badge,
                    ha='center', va='center', fontsize=7.5, fontweight='bold',
                    color='white', fontfamily=font_family, zorder=5)

        if subtitle:
            ax.text(x + w / 2, y + h / 2 + 0.6, title,
                    ha='center', va='center', fontsize=10.5, fontweight='bold',
                    color=text_color, fontfamily=font_family, zorder=4)
            ax.text(x + w / 2, y + h / 2 - 1.1, subtitle,
                    ha='center', va='center', fontsize=8.2, fontweight='normal',
                    color=C_TEXT_MUTED, fontfamily=font_family, zorder=4)
        else:
            ax.text(x + w / 2, y + h / 2, title,
                    ha='center', va='center', fontsize=10.5, fontweight='bold',
                    color=text_color, fontfamily=font_family, zorder=4)

    def draw_pill(x, y, w, h, text, color=C_START_END):
        draw_shadow(x, y, w, h, rad=1.5)
        pill = FancyBboxPatch((x, y), w, h,
                              boxstyle="round,pad=0.3,rounding_size=1.5",
                              ec=color, fc=color, lw=1.5, zorder=3)
        ax.add_patch(pill)
        ax.text(x + w / 2, y + h / 2, text,
                ha='center', va='center', fontsize=11, fontweight='bold',
                color='white', fontfamily=font_family, zorder=4)

    def draw_diamond(cx, cy, w, h, title, subtitle=""):
        shadow_pts = np.array([
            [cx + 0.35, cy + h / 2 - 0.35],
            [cx + w / 2 + 0.35, cy - 0.35],
            [cx + 0.35, cy - h / 2 - 0.35],
            [cx - w / 2 + 0.35, cy - 0.35]
        ])
        ax.add_patch(MplPolygon(shadow_pts, closed=True, ec="none", fc="#CBD5E1", alpha=0.45, zorder=2))

        pts = np.array([
            [cx, cy + h / 2],
            [cx + w / 2, cy],
            [cx, cy - h / 2],
            [cx - w / 2, cy]
        ])
        diamond = MplPolygon(pts, closed=True, ec=C_DECISION, fc=C_DECISION_BG, lw=2.2, zorder=3)
        ax.add_patch(diamond)

        if subtitle:
            ax.text(cx, cy + 0.5, title, ha='center', va='center', fontsize=9.5,
                    fontweight='bold', color=C_TEXT_MAIN, fontfamily=font_family, zorder=4)
            ax.text(cx, cy - 0.8, subtitle, ha='center', va='center', fontsize=8.0,
                    fontweight='normal', color=C_TEXT_MUTED, fontfamily=font_family, zorder=4)
        else:
            ax.text(cx, cy, title, ha='center', va='center', fontsize=9.5,
                    fontweight='bold', color=C_TEXT_MAIN, fontfamily=font_family, zorder=4)

    def draw_database(x, y, w, h, title, subtitle=""):
        draw_shadow(x, y, w, h, rad=0.5)
        box = FancyBboxPatch((x, y), w, h,
                             boxstyle="round,pad=0.2,rounding_size=0.6",
                             ec=C_DB_BORDER, fc=C_DB_BG, lw=2.2, zorder=3)
        ax.add_patch(box)
        top_bar = FancyBboxPatch((x + 0.4, y + h - 0.9), w - 0.8, 0.7,
                                 boxstyle="round,pad=0.1,rounding_size=0.3",
                                 ec=C_DB_BORDER, fc=C_DB, zorder=4)
        ax.add_patch(top_bar)
        ax.text(x + w / 2, y + h - 0.55, "SPATIAL DATABASE STORAGE",
                ha='center', va='center', fontsize=6.5, fontweight='bold',
                color='white', fontfamily=font_family, zorder=5)

        ax.text(x + w / 2, y + h / 2 + 0.2, title,
                ha='center', va='center', fontsize=10.5, fontweight='bold',
                color=C_TEXT_MAIN, fontfamily=font_family, zorder=4)
        if subtitle:
            ax.text(x + w / 2, y + h / 2 - 1.2, subtitle,
                    ha='center', va='center', fontsize=8.2, fontweight='normal',
                    color=C_TEXT_MUTED, fontfamily=font_family, zorder=4)

    def draw_arrow(p1, p2, label="", label_pos=(0.5, 0.5), label_side='right', color=C_ARROW, lw=1.8):
        ax.annotate('', xy=p2, xytext=p1,
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=lw,
                                    mutation_scale=14, shrinkA=3, shrinkB=3),
                    zorder=2)
        if label:
            lx = p1[0] + (p2[0] - p1[0]) * label_pos[0]
            ly = p1[1] + (p2[1] - p1[1]) * label_pos[1]
            offset_x = 0.8 if label_side == 'right' else (-0.8 if label_side == 'left' else 0)
            offset_y = 0.5 if label_side == 'top' else (-0.5 if label_side == 'bottom' else 0)
            bbox_dict = dict(boxstyle="round,pad=0.25", fc="white", ec="#CBD5E1", lw=1.0, alpha=0.95)
            ax.text(lx + offset_x, ly + offset_y, label,
                    fontsize=8.5, fontweight='bold', color=color,
                    ha='center', va='center', bbox=bbox_dict, fontfamily=font_family, zorder=6)

    def draw_elbow_arrow(pts, label="", label_idx=1, color=C_ARROW, lw=1.8):
        for i in range(len(pts) - 1):
            is_last = (i == len(pts) - 2)
            if is_last:
                ax.annotate('', xy=pts[i+1], xytext=pts[i],
                            arrowprops=dict(arrowstyle="-|>", color=color, lw=lw,
                                            mutation_scale=14, shrinkA=2, shrinkB=3),
                            zorder=2)
            else:
                ax.plot([pts[i][0], pts[i+1][0]], [pts[i][1], pts[i+1][1]],
                        color=color, lw=lw, zorder=2)
        if label:
            p1 = pts[label_idx]
            p2 = pts[label_idx + 1]
            lx = (p1[0] + p2[0]) / 2
            ly = (p1[1] + p2[1]) / 2
            bbox_dict = dict(boxstyle="round,pad=0.25", fc="white", ec="#CBD5E1", lw=1.0, alpha=0.95)
            ax.text(lx, ly, label, fontsize=8.5, fontweight='bold', color=color,
                    ha='center', va='center', bbox=bbox_dict, fontfamily=font_family, zorder=6)

    # 1. HEADER
    header_box = FancyBboxPatch((4, 93.2), 92, 5.4,
                                boxstyle="round,pad=0.3,rounding_size=0.6",
                                ec="#052E16", fc=C_HEADER_BG, lw=1.5, zorder=3)
    ax.add_patch(header_box)
    ax.text(50, 96.6, "MUNICIPAL AGRICULTURE OFFICE (MAO) — SILAGO, SOUTHERN LEYTE",
            ha='center', va='center', fontsize=12, fontweight='bold', color='#86EFAC',
            fontfamily=font_family, zorder=4)
    ax.text(50, 94.7, "Rice Farm Registry & Georeferencing GIS: End-to-End Operational Lifecycle Flowchart",
            ha='center', va='center', fontsize=14, fontweight='bold', color='white',
            fontfamily=font_family, zorder=4)

    # 2. START & AUTH
    draw_pill(37, 88.5, 26, 3.2, "START: Launch Silago Rice GIS Web Portal", C_START_END)
    draw_arrow((50, 88.5), (50, 85.8))
    draw_diamond(50, 83.2, 22, 5.0, "User Authentication?", "Role-Based Access Control (RBAC)")

    draw_elbow_arrow([(39, 83.2), (18, 83.2), (18, 77.2)], label="Guest / Public", label_idx=0, color=C_ARROW)
    draw_process(7, 72.8, 22, 4.4, "Public Portal Access",
                 "Read-Only GIS Map, Rice Varieties,\nWeather Radar, Gemini RiceSsistant",
                 badge="VIEWER MODE", bg_color="#F1F5F9", border_color="#94A3B8")
    draw_pill(9, 66.8, 18, 2.8, "Public Session Idle", "#64748B")
    draw_arrow((18, 72.8), (18, 69.6))

    draw_arrow((50, 80.7), (50, 77.2), label="MAO Admin / LFT Officer", label_side="right", color=C_GIS)

    # 3. FARMER RECORD VERIFICATION
    draw_process(35, 73.0, 30, 4.2, "Step 1: Farmer Profile Search & RSBSA Verification",
                 "Search national RSBSA Number, Farmer Family Name, or Contact",
                 badge="REGISTRY MODULE", bg_color=C_PROCESS_BG, border_color=C_PROCESS_BORDER)
    draw_arrow((50, 73.0), (50, 69.8))

    draw_diamond(50, 67.2, 22, 5.0, "Farmer Registered in DB?", "Verify RSBSA Existence")

    draw_elbow_arrow([(61, 67.2), (81, 67.2), (81, 62.0)], label="No (New Farmer)", label_idx=0, color=C_DECISION)
    draw_process(69, 57.6, 24, 4.4, "New Farmer Registration",
                 "Input Demographics, Purok, Tenure,\nValid Gov ID & Contact Details",
                 badge="NEW ENTRY", bg_color=C_DECISION_BG, border_color=C_DECISION)
    draw_elbow_arrow([(81, 57.6), (81, 52.8), (66, 52.8)], color=C_DECISION)

    draw_arrow((50, 64.7), (50, 61.2), label="Yes (Found)", label_side="left", color=C_GIS)
    draw_process(35, 57.0, 30, 4.2, "Step 2: Load Farmer Profile & Linked Parcels",
                 "Display existing farm holdings, RSBSA record, and cropping history",
                 badge="PROFILE LOADED", bg_color=C_PROCESS_BG, border_color=C_PROCESS_BORDER)
    draw_arrow((50, 57.0), (50, 54.0))
    draw_arrow((50, 54.0), (50, 51.0))

    # 4. GIS NAVIGATION & VECTOR PARCEL DELINEATION
    draw_process(32, 46.8, 36, 4.2, "Step 3: Barangay Spatial Navigation & Base Layer Selection",
                 "Zoom to target Silago Barangay (15 Barangays); Toggle Satellite & Topo Map",
                 badge="LEAFLET GIS ENGINE", bg_color=C_GIS_BG, border_color=C_GIS_BORDER)
    draw_arrow((50, 46.8), (50, 43.6))

    draw_process(32, 39.4, 36, 4.2, "Step 4: Vector Polygon Delineation & Geodesic Computation",
                 "Field technician traces boundary GPS vertices; System computes area in Hectares (ha)",
                 badge="SPATIAL TRACING", bg_color=C_GIS_BG, border_color=C_GIS_BORDER)
    draw_arrow((50, 39.4), (50, 36.2))

    # 5. SPATIAL CONFLICT AUDITING & VALIDATION
    draw_diamond(50, 33.6, 24, 5.2, "Spatial Conflict Audit?", "PostGIS ST_Intersects Validation")

    draw_elbow_arrow([(62, 33.6), (84, 33.6), (84, 39.4)], label="Overlap Detected", label_idx=0, color=C_ALERT)
    draw_process(72, 39.4, 24, 4.2, "Spatial Conflict Alert",
                 "Display Overlap Warning & Highlight;\nAdjust Vertices / Re-survey Boundary",
                 badge="VALIDATION WARNING", bg_color=C_ALERT_BG, border_color=C_ALERT)
    draw_elbow_arrow([(84, 43.6), (84, 45.4), (68, 45.4), (68, 41.5)], label="Re-trace", label_idx=1, color=C_ALERT)

    draw_arrow((50, 31.0), (50, 27.6), label="Geometry Valid / No Conflict", label_side="right", color=C_GIS)

    # 6. ATTRIBUTE DATA ENTRY & PERSISTENCE
    draw_process(32, 23.4, 36, 4.2, "Step 5: Attribute Data Entry & Geotagged Photos",
                 "Rice Variety (Inbred/Hybrid), Cropping Season, Ecosystem, Upload Field Photos",
                 badge="METADATA & EVIDENCE", bg_color=C_PROCESS_BG, border_color=C_PROCESS_BORDER)
    draw_arrow((50, 23.4), (50, 20.2))

    draw_database(32, 15.6, 36, 4.6, "Step 6: Supabase PostgreSQL + PostGIS Persistence",
                  "Commit records to farm_parcels & rice_farm_records with GIST spatial indexing;\nBroadcast real-time WebSocket sync to all MAO clients")
    draw_arrow((50, 15.6), (50, 12.6))

    # 7. MONITORING & REPORT GENERATION
    draw_process(32, 8.4, 36, 4.2, "Step 7: Seasonal Production Tracking & Crop Monitoring",
                 "Track Growth Stages (Tillering, Panicle, Harvest), Production Bags, & Pest Notices",
                 badge="PRODUCTION TRACKER", bg_color=C_REPORT_BG, border_color=C_REPORT)
    draw_arrow((50, 8.4), (50, 5.4))

    draw_elbow_arrow([(50, 5.4), (32, 5.4), (32, 3.8)], color=C_REPORT)
    draw_elbow_arrow([(50, 5.4), (68, 5.4), (68, 3.8)], color=C_START_END)

    draw_process(18, 0.6, 28, 3.2, "Official Reports & RSBSA Certificates",
                 "Export PDF/Excel/CSV, Barangay Masterlists",
                 badge="DOCUMENTATION", bg_color=C_REPORT_BG, border_color=C_REPORT)

    draw_pill(56, 0.6, 24, 3.2, "END: Parcel Registered & Synced", C_START_END)

    # 8. LEGEND BOX
    leg_x, leg_y, leg_w, leg_h = 5, 20.0, 23, 11.2
    legend_bg = FancyBboxPatch((leg_x, leg_y), leg_w, leg_h,
                               boxstyle="round,pad=0.2,rounding_size=0.5",
                               ec="#94A3B8", fc="white", lw=1.2, zorder=3)
    ax.add_patch(legend_bg)
    ax.text(leg_x + leg_w / 2, leg_y + leg_h - 1.0, "FLOWCHART SYMBOLOGY",
            ha='center', va='center', fontsize=8.5, fontweight='bold', color=C_TEXT_MAIN,
            fontfamily=font_family, zorder=4)

    items = [
        ("Start / End Terminal Node", C_START_END, "pill"),
        ("System Action / Processing", C_PROCESS_BORDER, "rect"),
        ("GIS Spatial Vector Operation", C_GIS_BORDER, "rect_gis"),
        ("Audit / Decision Gate", C_DECISION, "diamond"),
        ("PostGIS Spatial Database", C_DB_BORDER, "db"),
        ("Conflict / Exception Alert", C_ALERT, "rect_alert"),
    ]
    for idx, (label, color, shape) in enumerate(items):
        iy = leg_y + leg_h - 2.5 - (idx * 1.4)
        if shape == 'pill':
            p = FancyBboxPatch((leg_x + 1.2, iy - 0.4), 3.2, 0.8, boxstyle="round,pad=0.1,rounding_size=0.4",
                               ec=color, fc=color, zorder=4)
            ax.add_patch(p)
        elif shape == 'rect':
            p = FancyBboxPatch((leg_x + 1.2, iy - 0.4), 3.2, 0.8, boxstyle="round,pad=0.1,rounding_size=0.2",
                               ec=color, fc=C_PROCESS_BG, lw=1.2, zorder=4)
            ax.add_patch(p)
        elif shape == 'rect_gis':
            p = FancyBboxPatch((leg_x + 1.2, iy - 0.4), 3.2, 0.8, boxstyle="round,pad=0.1,rounding_size=0.2",
                               ec=color, fc=C_GIS_BG, lw=1.2, zorder=4)
            ax.add_patch(p)
        elif shape == 'diamond':
            d_pts = np.array([[leg_x + 2.8, iy + 0.4], [leg_x + 4.4, iy], [leg_x + 2.8, iy - 0.4], [leg_x + 1.2, iy]])
            ax.add_patch(MplPolygon(d_pts, closed=True, ec=color, fc=C_DECISION_BG, lw=1.2, zorder=4))
        elif shape == 'db':
            p = FancyBboxPatch((leg_x + 1.2, iy - 0.4), 3.2, 0.8, boxstyle="round,pad=0.1,rounding_size=0.2",
                               ec=color, fc=C_DB_BG, lw=1.2, zorder=4)
            ax.add_patch(p)
        elif shape == 'rect_alert':
            p = FancyBboxPatch((leg_x + 1.2, iy - 0.4), 3.2, 0.8, boxstyle="round,pad=0.1,rounding_size=0.2",
                               ec=color, fc=C_ALERT_BG, lw=1.2, zorder=4)
            ax.add_patch(p)

        ax.text(leg_x + 5.5, iy, label, ha='left', va='center', fontsize=7.6,
                fontweight='normal', color=C_TEXT_MAIN, fontfamily=font_family, zorder=4)

    plt.tight_layout(pad=1.0)
    plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Successfully generated process flowchart at: {output_path}")


def create_system_architecture_diagram(output_path):
    fig = plt.figure(figsize=(18, 14), dpi=200, facecolor='#F8FAFC')
    ax = fig.add_subplot(111)
    ax.set_facecolor('#F8FAFC')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Color Palette
    C_HEADER_BG = '#1E293B'      # Dark Slate
    C_TIER1_BG = '#EFF6FF'       # Blue Tint
    C_TIER1_BORDER = '#2563EB'   # Blue
    C_TIER2_BG = '#F0FDF4'       # Green Tint
    C_TIER2_BORDER = '#16A34A'   # Green
    C_TIER3_BG = '#FAF5FF'       # Purple Tint
    C_TIER3_BORDER = '#9333EA'   # Purple
    C_CARD_BG = '#FFFFFF'
    C_TEXT_MAIN = '#0F172A'
    C_TEXT_MUTED = '#64748B'

    def draw_shadow(x, y, w, h, rad=0.6):
        shadow = FancyBboxPatch((x + 0.3, y - 0.3), w, h,
                                boxstyle=f"round,pad=0.1,rounding_size={rad}",
                                ec="none", fc="#CBD5E1", alpha=0.4, zorder=2)
        ax.add_patch(shadow)

    def draw_card(x, y, w, h, title, items, badge="", header_color="#3B82F6"):
        draw_shadow(x, y, w, h, rad=0.6)
        card = FancyBboxPatch((x, y), w, h,
                              boxstyle="round,pad=0.1,rounding_size=0.6",
                              ec="#E2E8F0", fc=C_CARD_BG, lw=1.5, zorder=3)
        ax.add_patch(card)

        # Header bar
        hbar = FancyBboxPatch((x, y + h - 2.8), w, 2.8,
                              boxstyle="round,pad=0.05,rounding_size=0.4",
                              ec="none", fc=header_color, zorder=4)
        ax.add_patch(hbar)

        ax.text(x + w / 2, y + h - 1.4, title, ha='center', va='center',
                fontsize=9.5, fontweight='bold', color='white', fontfamily=font_family, zorder=5)

        for i, item in enumerate(items):
            iy = y + h - 4.2 - (i * 1.5)
            ax.plot([x + 1.2], [iy], marker='o', markersize=3.5, color=header_color, zorder=5)
            ax.text(x + 2.2, iy, item, ha='left', va='center',
                    fontsize=8.0, color=C_TEXT_MAIN, fontfamily=font_family, zorder=5)

    # 1. HEADER
    header_box = FancyBboxPatch((4, 91.5), 92, 6.5,
                                boxstyle="round,pad=0.3,rounding_size=0.6",
                                ec="#0F172A", fc=C_HEADER_BG, lw=1.5, zorder=3)
    ax.add_patch(header_box)
    ax.text(50, 95.5, "MUNICIPAL AGRICULTURE OFFICE (MAO) — SILAGO, SOUTHERN LEYTE",
            ha='center', va='center', fontsize=11, fontweight='bold', color='#38BDF8',
            fontfamily=font_family, zorder=4)
    ax.text(50, 93.3, "Figure 1: Three-Tier System Architecture of Rice Farm Registry & Georeferencing GIS",
            ha='center', va='center', fontsize=14, fontweight='bold', color='white',
            fontfamily=font_family, zorder=4)

    # TIER 1: CLIENT PRESENTATION TIER
    t1_y, t1_h = 63.0, 26.0
    tier1_bg = FancyBboxPatch((4, t1_y), 92, t1_h,
                              boxstyle="round,pad=0.2,rounding_size=0.8",
                              ec=C_TIER1_BORDER, fc=C_TIER1_BG, lw=1.8, zorder=2)
    ax.add_patch(tier1_bg)
    ax.text(6.5, t1_y + t1_h - 2.2, "TIER 1: PRESENTATION LAYER (CLIENT / WEB BROWSER)",
            fontsize=10.5, fontweight='bold', color='#1D4ED8', fontfamily=font_family, zorder=4)
    ax.text(6.5, t1_y + t1_h - 4.0, "React 19  •  TypeScript  •  Tailwind CSS  •  Vite  •  Leaflet.js  •  Lucide Icons",
            fontsize=8.0, fontweight='normal', color=C_TEXT_MUTED, fontfamily=font_family, zorder=4)

    # Cards in Tier 1
    draw_card(6, t1_y + 1.8, 20.5, 18.5, "Interactive GIS & Map", [
        "Leaflet.js Spatial View",
        "Esri Satellite & Topo Tiles",
        "15 Barangay Boundaries",
        "GPS Polygon Delineation",
        "Real-Time Area Calculation"
    ], header_color="#2563EB")

    draw_card(29, t1_y + 1.8, 20.5, 18.5, "Registry & Farmer Demographics", [
        "RSBSA Registry Profiles",
        "Tenurial Status (Owner/Tenant)",
        "Rice Variety & Seed Source",
        "Geotagged Photo Uploads",
        "LFT Assignment by Barangay"
    ], header_color="#0284C7")

    draw_card(52, t1_y + 1.8, 20.5, 18.5, "Crop & Seasonal Tracker", [
        "Wet/Dry Season Cropping",
        "Growth Stages (Tillering to Harvest)",
        "Cavans/Bags & MT/ha Yield",
        "Gross Income Estimation",
        "Pest & Disease Advisories"
    ], header_color="#059669")

    draw_card(75, t1_y + 1.8, 19.5, 18.5, "Reports & RiceSsistant AI", [
        "Official Certificate Generator",
        "Excel, CSV & PDF Exports",
        "Irrigators Assocs Summaries",
        "Google Gemini AI Chatbot",
        "Live Weather & Radar Feeds"
    ], header_color="#D97706")

    # Connector Arrow Tier 1 -> Tier 2
    ax.annotate('', xy=(50, 58.5), xytext=(50, 63.0),
                arrowprops=dict(arrowstyle="<|-|>", color="#1E293B", lw=2.2,
                                mutation_scale=16), zorder=5)
    ax.text(52.5, 60.7, "HTTPS / JSON API REST & WebSocket Real-time Subscriptions",
            fontsize=8.5, fontweight='bold', color="#1E293B", fontfamily=font_family, zorder=6)

    # TIER 2: APPLICATION & API LAYER
    t2_y, t2_h = 36.5, 21.0
    tier2_bg = FancyBboxPatch((4, t2_y), 92, t2_h,
                              boxstyle="round,pad=0.2,rounding_size=0.8",
                              ec=C_TIER2_BORDER, fc=C_TIER2_BG, lw=1.8, zorder=2)
    ax.add_patch(tier2_bg)
    ax.text(6.5, t2_y + t2_h - 2.2, "TIER 2: APPLICATION & API SERVICE LAYER (BACKEND / MIDDLEWARE)",
            fontsize=10.5, fontweight='bold', color='#15803D', fontfamily=font_family, zorder=4)
    ax.text(6.5, t2_y + t2_h - 4.0, "Node.js  •  Express Server  •  Vercel Serverless  •  Turf.js  •  Gemini 2.5 Flash API",
            fontsize=8.0, fontweight='normal', color=C_TEXT_MUTED, fontfamily=font_family, zorder=4)

    # Cards in Tier 2
    draw_card(6, t2_y + 1.8, 27.5, 14.0, "Security & Access Controller", [
        "Role-Based Access Control (RBAC)",
        "MAO Admin vs LFT Field Officers",
        "Token Session Management",
        "Action Auditing & Permissions"
    ], header_color="#16A34A")

    draw_card(36.2, t2_y + 1.8, 27.5, 14.0, "Geospatial & Vector Engine", [
        "Turf.js Geometric Computation",
        "Polygon Vertex Sanitization",
        "WGS84 (EPSG:4326) Projection",
        "Boundary Conflict Pre-audit"
    ], header_color="#0D9488")

    draw_card(66.5, t2_y + 1.8, 28, 14.0, "External Intelligence APIs", [
        "Google Gemini Flash 2.5 AI Core",
        "Rice Pest & Disease Diagnosis",
        "Open-Meteo Weather Radar Engine",
        "Vercel Serverless Server Endpoints"
    ], header_color="#CA8A04")

    # Connector Arrow Tier 2 -> Tier 3
    ax.annotate('', xy=(50, 31.8), xytext=(50, 36.5),
                arrowprops=dict(arrowstyle="<|-|>", color="#1E293B", lw=2.2,
                                mutation_scale=16), zorder=5)
    ax.text(52.5, 34.1, "PostgreSQL Protocol  •  PostGIS Spatial Queries  •  Storage S3 Protocol",
            fontsize=8.5, fontweight='bold', color="#1E293B", fontfamily=font_family, zorder=6)

    # TIER 3: SPATIAL PERSISTENCE LAYER
    t3_y, t3_h = 4.0, 26.5
    tier3_bg = FancyBboxPatch((4, t3_y), 92, t3_h,
                              boxstyle="round,pad=0.2,rounding_size=0.8",
                              ec=C_TIER3_BORDER, fc=C_TIER3_BG, lw=1.8, zorder=2)
    ax.add_patch(tier3_bg)
    ax.text(6.5, t3_y + t3_h - 2.2, "TIER 3: SPATIAL PERSISTENCE & DATA STORAGE LAYER (CLOUD DATABASE)",
            fontsize=10.5, fontweight='bold', color='#7E22CE', fontfamily=font_family, zorder=4)
    ax.text(6.5, t3_y + t3_h - 4.0, "Supabase Cloud  •  PostgreSQL 15  •  PostGIS Geospatial Engine  •  Supabase Storage",
            fontsize=8.0, fontweight='normal', color=C_TEXT_MUTED, fontfamily=font_family, zorder=4)

    # Cards in Tier 3
    draw_card(6, t3_y + 1.8, 27.5, 19.0, "PostGIS Spatial Tables", [
        "farm_parcels (Geometry polygons)",
        "rice_farm_records (Attributes)",
        "GIST Spatial Indexing (Fast queries)",
        "ST_Intersects (Overlap audit)",
        "ST_Area (Geodesic ha calculation)"
    ], header_color="#7C3AED")

    draw_card(36.2, t3_y + 1.8, 27.5, 19.0, "Relational Registry Tables", [
        "seasonal_production_records",
        "barangays & Purok Masterlists",
        "lft_technician_profiles",
        "irrigators_associations (BCIA, etc.)",
        "Foreign Key Constraints & Triggers"
    ], header_color="#9333EA")

    draw_card(66.5, t3_y + 1.8, 28, 19.0, "Storage & Replication Services", [
        "Supabase Storage Buckets (Photos)",
        "Farmer National ID Documents",
        "Geotagged Parcel Field Photos",
        "Postgres WAL Realtime Engine",
        "Daily Cloud Backups & Recovery"
    ], header_color="#6B21A8")

    plt.tight_layout(pad=1.0)
    plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Successfully generated architecture diagram at: {output_path}")

if __name__ == '__main__':
    # 1. Generate Process Flowchart (Figure 2)
    create_system_process_flowchart('system_process_flowchart.png')
    # 2. Generate Architecture Diagram (Figure 1)
    create_system_architecture_diagram('system_architecture_diagram.png')

    # Copy to parent Downloads folder and artifact folder
    artifact_dir = r"C:\Users\Admin\.gemini\antigravity\brain\ba0169cb-168c-413d-935a-5719f4fe7b33"
    downloads_dir = r"C:\Users\Admin\Downloads"

    for img_name in ['system_process_flowchart.png', 'system_architecture_diagram.png']:
        if os.path.exists(img_name):
            shutil.copy(img_name, os.path.join(downloads_dir, img_name))
            if os.path.exists(artifact_dir):
                shutil.copy(img_name, os.path.join(artifact_dir, img_name))
            print(f"Copied {img_name} to Downloads and Artifact directory.")
