import os
import shutil
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Polygon as MplPolygon
import numpy as np

font_family = 'Segoe UI'

def create_comprehensive_swimlane_flowchart(output_path):
    fig = plt.figure(figsize=(26, 20), dpi=200, facecolor='#F8FAFC')
    ax = fig.add_subplot(111)
    ax.set_facecolor('#F8FAFC')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Palette
    C_HEADER_MAIN = '#0F172A'
    C_TEXT = '#0F172A'
    C_MUTED = '#475569'
    C_ARROW = '#334155'
    C_CARD_BG = '#FFFFFF'

    # Swimlane Configurations (4 Lanes)
    # 1. Farmer / Public (X: 3.5 to 26)
    # 2. LFT Field Mapper (X: 27.5 to 50)
    # 3. MAO Admin (X: 51.5 to 74)
    # 4. System & PostGIS DB (X: 75.5 to 98)
    lanes = [
        {
            'title': 'FARMER / PUBLIC VIEWER',
            'role': 'Beneficiary & Client Portal',
            'x1': 3.5, 'w': 22.5,
            'header_color': '#EA580C', # Deep Orange
            'bg_color': '#FFF7ED',     # Soft Orange
            'border_color': '#FDBA74'
        },
        {
            'title': 'LOCAL FARMER TECHNICIAN (LFT)',
            'role': 'Field Mapper & Agricultural Extension',
            'x1': 27.5, 'w': 22.5,
            'header_color': '#2563EB', # Blue
            'bg_color': '#EFF6FF',     # Soft Blue
            'border_color': '#93C5FD'
        },
        {
            'title': 'MAO ADMINISTRATOR',
            'role': 'Municipal Agriculturist & Validator',
            'x1': 51.5, 'w': 22.5,
            'header_color': '#4F46E5', # Indigo
            'bg_color': '#EEF2FF',     # Soft Indigo
            'border_color': '#A5B4FC'
        },
        {
            'title': 'SYSTEM ENGINE & POSTGIS DB',
            'role': 'Spatial Calculations, AI & Persistence',
            'x1': 75.5, 'w': 22.5,
            'header_color': '#16A34A', # Emerald Green
            'bg_color': '#F0FDF4',     # Soft Green
            'border_color': '#86EFAC'
        }
    ]

    lane_top = 90.0
    lane_bottom = 2.0
    lane_h = lane_top - lane_bottom

    # Draw Swimlane Backgrounds & Headers
    for lane in lanes:
        # Background column
        bg = FancyBboxPatch((lane['x1'], lane_bottom), lane['w'], lane_h,
                            boxstyle="round,pad=0.1,rounding_size=0.5",
                            ec=lane['border_color'], fc=lane['bg_color'], lw=1.5, zorder=1)
        ax.add_patch(bg)

        # Header block
        hb = FancyBboxPatch((lane['x1'], lane_top - 3.8), lane['w'], 3.8,
                            boxstyle="round,pad=0.05,rounding_size=0.4",
                            ec="none", fc=lane['header_color'], zorder=3)
        ax.add_patch(hb)

        ax.text(lane['x1'] + lane['w'] / 2, lane_top - 1.4, lane['title'],
                ha='center', va='center', fontsize=9.8, fontweight='bold',
                color='white', fontfamily=font_family, zorder=4)
        ax.text(lane['x1'] + lane['w'] / 2, lane_top - 2.8, lane['role'],
                ha='center', va='center', fontsize=7.8, fontweight='normal',
                color='#F8FAFC', fontfamily=font_family, zorder=4)

    # 1. MAIN BANNER HEADER
    main_header = FancyBboxPatch((3.5, 91.5), 94.5, 6.8,
                                 boxstyle="round,pad=0.2,rounding_size=0.6",
                                 ec="#0F172A", fc=C_HEADER_MAIN, lw=1.8, zorder=5)
    ax.add_patch(main_header)
    ax.text(50.75, 95.8, "MUNICIPAL AGRICULTURE OFFICE (MAO) — LGU SILAGO, SOUTHERN LEYTE",
            ha='center', va='center', fontsize=12, fontweight='bold', color='#38BDF8',
    ax.text(50.75, 96.2, "MUNICIPAL AGRICULTURE OFFICE (MAO) — LGU SILAGO, SOUTHERN LEYTE",
            ha='center', va='center', fontsize=11.5, fontweight='bold', color='#38BDF8',
            fontfamily=font_family, zorder=6)
    ax.text(50.75, 93.4, "Rice Farm Registry & Georeferencing GIS: Comprehensive Cross-Functional Swimlane Flowchart",
            ha='center', va='center', fontsize=14, fontweight='bold', color='white',
    ax.text(50.75, 94.2, "Rice Farm Registry & Georeferencing GIS: Comprehensive Cross-Functional Swimlane Flowchart",
            ha='center', va='center', fontsize=13.5, fontweight='bold', color='white',
            fontfamily=font_family, zorder=6)
    ax.text(50.75, 92.4, "P1: Authentication  •  P2: RSBSA Profiling  •  P3: GIS Mapping  •  P4: Conflict Audit  •  P5: Data Persistence  •  P6: Phenological Tracking  •  P7: Certification & DA Masterlist",
            ha='center', va='center', fontsize=8.2, fontweight='bold', color='#94A3B8',
            fontfamily=font_family, zorder=6)

    # Draw Horizontal Phase Markers on the left edge
    phases = [
        ("Phase 1: Authentication & Access Control", 84.5),
        ("Phase 2: RSBSA Profiling & Identity Verification", 72.5),
        ("Phase 3: Interactive GIS Mapping & Polygon Delineation", 57.5),
        ("Phase 4: Spatial Conflict Auditing (PostGIS)", 43.5),
        ("Phase 5: Attribute Entry & Data Persistence", 31.0),
        ("Phase 6: Seasonal Growth Tracking & Yield Assessment", 19.0),
        ("Phase 7: Certification, DA Reporting & Masterlist", 7.0),
    # Draw Horizontal Phase Markers & Boundaries between Phases
    phases_info = [
        {'num': 'P1', 'badge_y': 81.0, 'div_y': None},
        {'num': 'P2', 'badge_y': 67.4, 'div_y': 73.5},
        {'num': 'P3', 'badge_y': 51.0, 'div_y': 59.4},
        {'num': 'P4', 'badge_y': 38.6, 'div_y': 43.7},
        {'num': 'P5', 'badge_y': 28.5, 'div_y': 33.5},
        {'num': 'P6', 'badge_y': 17.7, 'div_y': 22.7},
        {'num': 'P7', 'badge_y': 6.4,  'div_y': 11.3},
    ]
    for p_name, py in phases:
        ax.plot([3.5, 98], [py + 4.5, py + 4.5], color='#94A3B8', linestyle='--', lw=0.9, alpha=0.5, zorder=2)
        p_badge = FancyBboxPatch((0.4, py + 3.8), 2.8, 1.4, boxstyle="round,pad=0.1,rounding_size=0.3",

    for p in phases_info:
        # Left margin phase badge
        p_badge = FancyBboxPatch((0.4, p['badge_y'] - 0.7), 2.8, 1.4,
                                 boxstyle="round,pad=0.1,rounding_size=0.3",
                                 ec="#475569", fc="#1E293B", zorder=6)
        ax.add_patch(p_badge)
        p_num = p_name.split(':')[0].replace('Phase ', 'P')
        ax.text(1.8, py + 4.5, p_num, ha='center', va='center', fontsize=7.5,
        ax.text(1.8, p['badge_y'], p['num'], ha='center', va='center', fontsize=7.5,
                fontweight='bold', color='white', fontfamily=font_family, zorder=7)

        # Subtle phase boundary line
        if p['div_y'] is not None:
            ax.plot([3.5, 98.0], [p['div_y'], p['div_y']], color='#94A3B8',
                    linestyle='--', lw=0.9, alpha=0.45, zorder=2)

    # Reusable Draw Helpers
    def draw_box(x, y, w, h, title, subtitle="", badge="", badge_color="#3B82F6", border_color="#CBD5E1", bg_color=C_CARD_BG, is_decision=False):
        # Shadow
        shadow = FancyBboxPatch((x + 0.25, y - 0.25), w, h,
                                boxstyle="round,pad=0.15,rounding_size=0.5",
                                ec="none", fc="#94A3B8", alpha=0.35, zorder=2)
        ax.add_patch(shadow)

        box = FancyBboxPatch((x, y), w, h,
                             boxstyle="round,pad=0.15,rounding_size=0.5",
                             ec=border_color, fc=bg_color, lw=1.5, zorder=3)
        ax.add_patch(box)

        if badge:
            bw = len(badge) * 0.45 + 1.2
            bb = FancyBboxPatch((x + 0.6, y + h - 0.7), bw, 1.0,
                                boxstyle="round,pad=0.05,rounding_size=0.25",
                                ec="none", fc=badge_color, zorder=4)
            ax.add_patch(bb)
            ax.text(x + 0.6 + bw/2, y + h - 0.2, badge, ha='center', va='center',
                    fontsize=6.5, fontweight='bold', color='white', fontfamily=font_family, zorder=5)

        if subtitle:
            ax.text(x + w / 2, y + h / 2 + 0.45, title, ha='center', va='center',
                    fontsize=8.5, fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)
            ax.text(x + w / 2, y + h / 2 - 0.85, subtitle, ha='center', va='center',
                    fontsize=7.2, color=C_MUTED, fontfamily=font_family, zorder=4)
        else:
            ax.text(x + w / 2, y + h / 2, title, ha='center', va='center',
                    fontsize=8.5, fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)

    def draw_decision(cx, cy, w, h, title, subtitle="", border_color="#D97706", bg_color="#FEF3C7"):
        # Shadow
        s_pts = np.array([[cx + 0.25, cy + h/2 - 0.25], [cx + w/2 + 0.25, cy - 0.25],
                          [cx + 0.25, cy - h/2 - 0.25], [cx - w/2 + 0.25, cy - 0.25]])
        ax.add_patch(MplPolygon(s_pts, closed=True, ec="none", fc="#94A3B8", alpha=0.35, zorder=2))

        pts = np.array([[cx, cy + h/2], [cx + w/2, cy], [cx, cy - h/2], [cx - w/2, cy]])
        diamond = MplPolygon(pts, closed=True, ec=border_color, fc=bg_color, lw=1.8, zorder=3)
        ax.add_patch(diamond)

        if subtitle:
            ax.text(cx, cy + 0.35, title, ha='center', va='center', fontsize=8.0,
                    fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)
            ax.text(cx, cy - 0.65, subtitle, ha='center', va='center', fontsize=6.8,
                    color=C_MUTED, fontfamily=font_family, zorder=4)
        else:
            ax.text(cx, cy, title, ha='center', va='center', fontsize=8.0,
                    fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)

    def draw_pill(x, y, w, h, text, color="#0F766E"):
        shadow = FancyBboxPatch((x + 0.25, y - 0.25), w, h,
                                boxstyle="round,pad=0.2,rounding_size=1.0",
                                ec="none", fc="#94A3B8", alpha=0.35, zorder=2)
        ax.add_patch(shadow)
        pill = FancyBboxPatch((x, y), w, h,
                              boxstyle="round,pad=0.2,rounding_size=1.0",
                              ec=color, fc=color, lw=1.5, zorder=3)
        ax.add_patch(pill)
        ax.text(x + w / 2, y + h / 2, text, ha='center', va='center',
                fontsize=8.5, fontweight='bold', color='white', fontfamily=font_family, zorder=4)

    def draw_arrow(p1, p2, label="", label_pos=0.5, color=C_ARROW, lw=1.6):
        ax.annotate('', xy=p2, xytext=p1,
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=lw,
                                    mutation_scale=12, shrinkA=2, shrinkB=2),
                    zorder=3)
        if label:
            lx = p1[0] + (p2[0] - p1[0]) * label_pos
            ly = p1[1] + (p2[1] - p1[1]) * label_pos
            ax.text(lx, ly, label, fontsize=7.2, fontweight='bold', color=color,
                    ha='center', va='center', bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="#CBD5E1", lw=0.8, alpha=0.95),
                    fontfamily=font_family, zorder=6)

    def draw_elbow(pts, label="", label_idx=0, color=C_ARROW, lw=1.6):
    def draw_elbow(pts, label="", label_idx=0, label_pos=0.5, color=C_ARROW, lw=1.6):
        for i in range(len(pts) - 1):
            if i == len(pts) - 2:
                ax.annotate('', xy=pts[i+1], xytext=pts[i],
                            arrowprops=dict(arrowstyle="-|>", color=color, lw=lw,
                                            mutation_scale=12, shrinkA=2, shrinkB=2),
                            zorder=3)
            else:
                ax.plot([pts[i][0], pts[i+1][0]], [pts[i][1], pts[i+1][1]],
                        color=color, lw=lw, zorder=3)
        if label:
            p1 = pts[label_idx]
            p2 = pts[label_idx + 1]
            lx = (p1[0] + p2[0]) / 2
            ly = (p1[1] + p2[1]) / 2
            lx = p1[0] + (p2[0] - p1[0]) * label_pos
            ly = p1[1] + (p2[1] - p1[1]) * label_pos
            ax.text(lx, ly, label, fontsize=7.2, fontweight='bold', color=color,
                    ha='center', va='center', bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="#CBD5E1", lw=0.8, alpha=0.95),
                    fontfamily=font_family, zorder=6)

    # -----------------------------------------------------------------
    # PHASE 1: AUTHENTICATION & ACCESS CONTROL (Y: 88 to 76)
    # -----------------------------------------------------------------
    # Lane 1 (Farmer/Public)
    draw_pill(5.5, 82.5, 18.5, 2.8, "START: Visit Public Web Portal", "#EA580C")
    draw_box(5.5, 76.5, 18.5, 4.2, "Public GIS & Advisory Access",
             "View Silago Registry Map, Varieties,\nWeather Radar & RiceSsistant AI",
             badge="PUBLIC VIEWER", badge_color="#C2410C", border_color="#FDBA74")
    draw_arrow((14.75, 82.5), (14.75, 80.7))

    # Lane 2 (LFT)
    draw_pill(29.5, 82.5, 18.5, 2.8, "START: LFT Mobile / Web Login", "#2563EB")
    draw_box(29.5, 76.5, 18.5, 4.2, "Enter LFT Credentials",
             "Login with assigned Silago Barangay\ncredentials (e.g. Balagawan LFT)",
             badge="LFT AUTH", badge_color="#1D4ED8", border_color="#93C5FD")
    draw_arrow((38.75, 82.5), (38.75, 80.7))

    # Lane 3 (Admin)
    draw_pill(53.5, 82.5, 18.5, 2.8, "START: MAO Official Login", "#4F46E5")
    draw_box(53.5, 76.5, 18.5, 4.2, "Enter Admin Credentials",
             "Municipal Agriculturist Master Account\nAccess full CRUD & approval portal",
             badge="ADMIN AUTH", badge_color="#4338CA", border_color="#A5B4FC")
    draw_arrow((62.75, 82.5), (62.75, 80.7))

    # Lane 4 (System)
    draw_decision(86.75, 78.6, 17.5, 4.5, "Verify JWT & Role?", "Check RBAC Permissions",
                  border_color="#16A34A", bg_color="#DCFCE7")
    draw_elbow([(48.0, 78.6), (78.0, 78.6)], label="Verify", color="#2563EB")
    draw_elbow([(72.0, 78.6), (78.0, 78.6)], color="#4F46E5")
    # Admin connects directly to left vertex of diamond
    draw_arrow((72.0, 78.6), (78.0, 78.6), label="Admin Auth", color="#4F46E5")
    # LFT credentials route underneath Phase 1 cards to bottom of diamond without colliding with Admin
    draw_elbow([(38.75, 76.5), (38.75, 74.6), (86.75, 74.6), (86.75, 76.35)],
               label="Verify LFT JWT & Barangay Role", label_idx=1, color="#2563EB")

    # -----------------------------------------------------------------
    # PHASE 2: RSBSA PROFILING & IDENTITY VERIFICATION (Y: 74 to 62)
    # -----------------------------------------------------------------
    # Lane 1 (Farmer)
    draw_box(5.5, 65.0, 18.5, 4.8, "Submit RSBSA Details & Tenancy",
             "Provide RSBSA ID, Land Title / Tenancy\nAgreement, Valid Gov ID, Contact",
             badge="REQUIREMENTS", badge_color="#EA580C", border_color="#FDBA74")
    draw_arrow((14.75, 76.5), (14.75, 69.8), label="Apply for Registry", lw=1.5)

    # Lane 2 (LFT)
    draw_box(29.5, 65.0, 18.5, 4.8, "Farmer Profile Inquiry & Search",
             "Search RSBSA No. / Family Name in\nSilago Municipal Database",
             badge="LFT PORTAL", badge_color="#2563EB", border_color="#93C5FD")
    draw_elbow([(24.0, 67.4), (29.5, 67.4)], label="Submit Documents", color="#EA580C")
    draw_elbow([(24.0, 67.4), (29.5, 67.4)], label="Submit Docs", color="#EA580C")

    # Lane 4 (System)
    draw_decision(86.75, 67.4, 17.5, 4.8, "Farmer Found in DB?", "Search rice_farm_records",
                  border_color="#D97706", bg_color="#FEF3C7")
    draw_arrow((48.0, 67.4), (78.0, 67.4), label="Query Record", color="#2563EB")

    # Lane 3 (Admin)
    draw_box(53.5, 65.0, 18.5, 4.8, "Review Farmer RSBSA Profile",
             "Verify Tenurial Status:\nOwner-Cultivator, Tenant, ARB, Lessee",
             badge="MAO AUDIT", badge_color="#4F46E5", border_color="#A5B4FC")

    # Record Exists vs New Branch
    draw_elbow([(86.75, 65.0), (86.75, 60.5), (72.0, 60.5), (72.0, 65.0)], label="Existing: Load Profile", color="#16A34A")
    draw_elbow([(86.75, 69.8), (86.75, 73.0), (48.0, 73.0), (48.0, 69.8)], label="New: Create Profile", color="#D97706")
    # Lane 4 (System)
    draw_decision(86.75, 67.4, 17.5, 4.8, "Farmer Found in DB?", "Search rice_farm_records",
                  border_color="#D97706", bg_color="#FEF3C7")
    # Query routes above Phase 2 cards without cutting through Admin box
    draw_elbow([(38.75, 69.8), (38.75, 72.0), (86.75, 72.0), (86.75, 69.8)],
               label="Query RSBSA Record", label_idx=1, color="#2563EB")

    # Existing Profile -> Direct to Admin Review Queue
    draw_arrow((78.0, 67.4), (72.0, 67.4), label="Existing: Load Profile", color="#16A34A")
    # New Profile -> Direct to LFT Parcel Delineation (Phase 3)
    draw_elbow([(86.75, 65.0), (86.75, 61.2), (38.75, 61.2), (38.75, 57.2)],
               label="New Farmer: Delineate Parcel", label_idx=1, color="#D97706")

    # -----------------------------------------------------------------
    # PHASE 3: INTERACTIVE GIS MAPPING & DELINEATION (Y: 60 to 47)
    # -----------------------------------------------------------------
    # Lane 2 (LFT)
    draw_box(29.5, 52.0, 18.5, 5.2, "Barangay Navigation & Basemap",
             "Select target Barangay (15 Silago Barangays);\nToggle Satellite (Esri/Google) / Topo Tiles;\nLocate parcel via GPS coordinates",
             badge="LEAFLET GIS", badge_color="#059669", border_color="#6EE7B7")
    draw_arrow((38.75, 65.0), (38.75, 57.2))

    draw_box(29.5, 44.5, 18.5, 5.4, "Vector Polygon Delineation",
             "Trace parcel perimeter GPS vertices [lat, lng];\nCapture geotagged parcel photo;\nUpload farmer national ID photo",
             badge="VECTOR DRAW", badge_color="#0284C7", border_color="#7DD3FC")
    draw_arrow((38.75, 52.0), (38.75, 49.9))

    # Lane 4 (System)
    draw_box(75.5, 52.0, 22.0, 5.2, "Geodesic Area Computation",
             "Turf.js & PostGIS ST_Area:\nAutomatically calculate surface land area\nin precise Hectares (ha)",
             badge="GEODESIC ENGINE", badge_color="#16A34A", border_color="#86EFAC")
    draw_elbow([(48.0, 47.2), (75.5, 54.6)], label="Stream Vertices", color="#0284C7")
    # Orthogonal stream vertices line across open space in Lane 3
    draw_elbow([(48.0, 47.2), (73.5, 47.2), (73.5, 54.6), (75.5, 54.6)],
               label="Stream GPS Vertices", label_idx=0, color="#0284C7")

    # -----------------------------------------------------------------
    # PHASE 4: SPATIAL CONFLICT AUDITING (Y: 44 to 33)
    # -----------------------------------------------------------------
    # Lane 4 (System)
    draw_decision(86.75, 42.0, 18.0, 5.2, "Overlap Audit Passed?", "PostGIS ST_Intersects",
                  border_color="#DC2626", bg_color="#FEF2F2")
    draw_arrow((86.75, 52.0), (86.75, 44.6), label="Audit Geometry", color="#16A34A")

    # Lane 2 (LFT Conflict Alert)
    draw_box(29.5, 36.5, 18.5, 5.2, "Spatial Conflict Warning Alert",
    draw_box(29.5, 36.0, 18.5, 5.2, "Spatial Conflict Warning Alert",
             "Overlap detected (>0.01% with neighbor);\nHighlight conflicting boundary vertex;\nAdjust vertices / Field re-survey",
             badge="TOPOLOGY ALERT", badge_color="#DC2626", border_color="#FCA5A5")
    draw_elbow([(77.75, 42.0), (48.0, 42.0), (48.0, 39.1)], label="Overlap Detected", color="#DC2626")
    draw_elbow([(38.75, 41.7), (38.75, 44.5)], label="Re-trace Vertices", color="#DC2626")

    # Lane 3 (Admin Conflict Review)
    draw_box(53.5, 36.5, 18.5, 5.2, "Boundary Dispute Mediation",
    draw_box(53.5, 36.0, 18.5, 5.2, "Boundary Dispute Mediation",
             "MAO Admin reviews boundary conflicts;\nVerify Barangay agrarian boundary line;\nAuthorize adjustments",
             badge="ADMIN RESOLUTION", badge_color="#4F46E5", border_color="#A5B4FC")
    draw_arrow((48.0, 39.1), (53.5, 39.1), label="Escalate if Disputed", color="#4F46E5")

    # Passed Audit
    draw_elbow([(86.75, 39.4), (86.75, 34.0)], label="Audit Passed (Clean)", color="#16A34A")
    # Overlap Detected routes cleanly above Lane 3 box into LFT
    draw_elbow([(77.75, 42.0), (75.0, 42.0), (75.0, 43.2), (38.75, 43.2), (38.75, 41.2)],
               label="Overlap Detected (>0.01%)", label_idx=2, color="#DC2626")
    # Escalate dispute from LFT to Admin
    draw_arrow((48.0, 38.6), (53.5, 38.6), label="Escalate", color="#4F46E5")
    # Re-trace loop around the side
    draw_elbow([(29.5, 38.6), (27.8, 38.6), (27.8, 47.2), (29.5, 47.2)],
               label="Re-trace", label_idx=1, color="#DC2626")

    # Audit Passed routes cleanly below Phase 4 into Phase 5
    draw_elbow([(86.75, 39.4), (86.75, 34.3), (38.75, 34.3), (38.75, 32.7)],
               label="Audit Passed: Proceed to Entry", label_idx=1, color="#16A34A")

    # -----------------------------------------------------------------
    # PHASE 5: ATTRIBUTE ENTRY & DATA PERSISTENCE (Y: 33 to 22)
    # -----------------------------------------------------------------
    # Lane 2 (LFT)
    draw_box(29.5, 27.5, 18.5, 5.2, "Crop & Production Metadata",
    draw_box(29.5, 27.0, 18.5, 5.7, "Crop & Production Metadata",
             "Rice Variety: Inbred (Rc 222) / Hybrid (Rc 488H);\nSeason: Wet Season / Dry Season 2026;\nEcosystem: Irrigated NIA / Rainfed Lowland;\nWater Source: BCIA / Gravity",
             badge="CROP ATTRIBUTES", badge_color="#2563EB", border_color="#93C5FD")
    draw_elbow([(86.75, 34.0), (60.0, 34.0), (48.0, 30.1)], label="Proceed to Entry", color="#16A34A")

    # Lane 3 (Admin Notification)
    draw_box(53.5, 27.0, 18.5, 5.7, "MAO Dashboard Real-Time Sync",
             "Live update on MAO workstation map;\nIncremental KPI count for Barangay;\nRecord queued for harvest monitoring",
             badge="REAL-TIME MONITOR", badge_color="#4F46E5", border_color="#A5B4FC")

    # Lane 4 (System Database Persistence)
    draw_box(75.5, 26.5, 22.0, 6.2, "Supabase Cloud Database Commit",
             "1. farm_parcels (PostGIS Polygon Geometry)\n2. rice_farm_records (RSBSA & Demographics)\n3. Supabase Storage (Geotagged Photos)\n4. Real-time WebSocket Multi-user Broadcast",
             badge="SPATIAL PERSISTENCE", badge_color="#16A34A", border_color="#86EFAC")
    draw_arrow((48.0, 29.6), (75.5, 29.6), label="Commit Transaction", color="#2563EB")

    # Lane 3 (Admin Notification)
    draw_box(53.5, 27.5, 18.5, 5.2, "MAO Dashboard Real-Time Sync",
             "Live update on MAO workstation map;\nIncremental KPI count for Barangay;\nRecord queued for harvest monitoring",
             badge="REAL-TIME MONITOR", badge_color="#4F46E5", border_color="#A5B4FC")
    draw_elbow([(86.5, 26.5), (86.5, 24.5), (62.75, 24.5), (62.75, 27.5)], label="WebSocket Sync", color="#4F46E5")
    # LFT commits metadata below the cards to avoid cutting through Admin box
    draw_elbow([(38.75, 27.0), (38.75, 24.5), (86.75, 24.5), (86.75, 26.5)],
               label="Commit Spatial & Crop Records", label_idx=1, color="#2563EB")
    # Real-Time WebSocket sync directly from DB to Admin
    draw_arrow((75.5, 29.8), (72.0, 29.8), label="WebSocket Sync", color="#4F46E5")

    # -----------------------------------------------------------------
    # PHASE 6: SEASONAL TRACKING & YIELD ASSESSMENT (Y: 22 to 10)
    # -----------------------------------------------------------------
    # Lane 1 (Farmer Advisory Access)
    draw_box(5.5, 14.5, 18.5, 6.4, "Farmer Advisory & SMS/Portal Alert",
             "Farmer checks recommended harvest date,\nweather advisory, and pest mitigation tips\nvia RiceSsistant public chat widget",
             badge="ADVISORY ACCESS", badge_color="#EA580C", border_color="#FDBA74")

    # Lane 2 (LFT Field Monitoring)
    draw_box(29.5, 14.5, 18.5, 6.4, "Phenological Stage Tracking",
             "Monitor Days After Sowing (DAS):\n• Vegetative / Seedling\n• Tillering (Vegetative Active)\n• Panicle Initiation & Flowering\n• Harvest Yield (Cavans/Bags, MT, Gross ₱)\n• Pest & Disease Advisory Log",
             badge="FIELD MONITORING", badge_color="#0284C7", border_color="#7DD3FC")
    draw_arrow((38.75, 27.5), (38.75, 20.9))
    draw_arrow((38.75, 27.0), (38.75, 20.9))

    # Lane 4 (System AI Core)
    draw_box(75.5, 14.5, 22.0, 6.4, "RiceSsistant AI & Weather Radar",
             "Google Gemini 2.5 Flash Agronomy Core:\n• Automated Rice Blast & Pest Advisory\n• Fertilizer & Maturity Calculations\n• Open-Meteo Rainfall & Radar Integration",
             badge="GEMINI 2.5 FLASH AI", badge_color="#D97706", border_color="#FCD34D")
    draw_elbow([(48.0, 17.7), (75.5, 17.7)], label="AI Diagnostic Prompt", color="#D97706")

    # Lane 1 (Farmer Advisory Access)
    draw_box(5.5, 14.5, 18.5, 6.4, "Farmer Advisory & SMS/Portal Alert",
             "Farmer checks recommended harvest date,\nweather advisory, and pest mitigation tips\nvia RiceSsistant public chat widget",
             badge="ADVISORY ACCESS", badge_color="#EA580C", border_color="#FDBA74")
    draw_elbow([(75.5, 16.0), (60.0, 16.0), (24.0, 16.0)], label="Broadcast Advisory", color="#D97706")
    # LFT queries AI across empty Lane 3
    draw_arrow((48.0, 17.7), (75.5, 17.7), label="AI Agronomy Query", color="#D97706")
    # Advisory broadcast routes below Phase 6 cards across open channel to Farmer
    draw_elbow([(86.75, 14.5), (86.75, 12.2), (14.75, 12.2), (14.75, 14.5)],
               label="Broadcast Pest & Weather Advisory", label_idx=1, color="#D97706")

    # -----------------------------------------------------------------
    # PHASE 7: CERTIFICATION, DA REPORTING & MASTERLIST (Y: 10 to 2)
    # -----------------------------------------------------------------
    # Lane 1 (Farmer Certificate Receipt)
    draw_pill(5.5, 4.5, 18.5, 3.8, "END: Farmer Receives MAO Certificate\n& DA Subsidies / PCIC Insurance", "#15803D")

    # Lane 2 yields to Admin
    draw_elbow([(38.75, 14.5), (38.75, 10.6), (62.75, 10.6), (62.75, 9.3)],
               label="Submit Harvest Yield", label_idx=1, color="#2563EB")

    # Lane 3 (Admin Approval & Certification)
    draw_box(53.5, 3.5, 18.5, 5.8, "MAO Official Certification & Seal",
             "Generate & Sign Official MAO Certificate\nof Rice Farm Registration;\nAffix Municipal Dry Seal & Reference QR;\nAuthorize DA RSBSA Benefits",
             badge="FINAL ACCREDITATION", badge_color="#4F46E5", border_color="#A5B4FC")
    draw_elbow([(38.75, 14.5), (38.75, 9.3), (53.5, 9.3), (53.5, 6.4)], label="Submit Harvest Yield", color="#2563EB")

    # Lane 4 (Reports Export)
    draw_box(75.5, 3.5, 22.0, 5.8, "Automated DA Report Generation",
             "Export Municipal Rice Masterlists:\n• PDF Official Registration Letters\n• Excel / CSV DA Regional Reports\n• Irrigators Association (BCIA) Summaries",
             badge="OFFICIAL EXPORTS", badge_color="#16A34A", border_color="#86EFAC")
    draw_arrow((72.0, 6.4), (75.5, 6.4), label="Trigger Export", color="#4F46E5")

    # Lane 1 (Farmer Certificate Receipt)
    draw_pill(5.5, 4.5, 18.5, 3.6, "END: Farmer Receives MAO Certificate\n& DA Subsidies / PCIC Insurance", "#15803D")
    draw_elbow([(53.5, 6.4), (45.0, 6.4), (24.0, 6.4)], label="Issue Certificate", color="#15803D")
    # Admin triggers DA Export
    draw_arrow((72.0, 6.4), (75.5, 6.4), label="Trigger Export", color="#16A34A")
    # Admin issues certificate to Farmer across empty Lane 2
    draw_arrow((53.5, 6.4), (24.0, 6.4), label="Issue Official Certificate", color="#15803D")

    plt.tight_layout(pad=1.0)
    plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Successfully generated comprehensive swimlane flowchart at: {output_path}")

if __name__ == '__main__':
    out_img = 'system_process_swimlane_flowchart.png'
    create_comprehensive_swimlane_flowchart(out_img)

    # Copy to parent Downloads folder and artifact folder
    artifact_dir = r"C:\Users\Admin\.gemini\antigravity\brain\ba0169cb-168c-413d-935a-5719f4fe7b33"
    downloads_dir = r"C:\Users\Admin\Downloads"
    # Copy to parent Downloads folder and artifact folders
    destinations = [
        r"C:\Users\Admin\Downloads",
        r"C:\Users\Admin\.gemini\antigravity\brain\ba0169cb-168c-413d-935a-5719f4fe7b33",
        r"C:\Users\Admin\.gemini\antigravity\brain\88361f58-bd28-4104-92df-58c2c4c87a29"
    ]

    for dest in [downloads_dir, artifact_dir]:
    for dest in destinations:
        if os.path.exists(dest):
            shutil.copy(out_img, os.path.join(dest, out_img))
            print(f"Copied {out_img} to {dest}")
