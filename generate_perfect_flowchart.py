import os
import shutil
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Polygon as MplPolygon
import numpy as np

font_family = 'Segoe UI'

def create_clean_academic_flowchart(output_path):
    # Professional 3:4 Academic Poster / Manuscript Ratio (20 x 28 inches @ 200 DPI = 4000 x 5600 px)
    fig = plt.figure(figsize=(20, 28), dpi=200, facecolor='#FFFFFF')
    ax = fig.add_subplot(111)
    ax.set_facecolor('#FFFFFF')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Color Palette (Crisp, High-Contrast Academic Theme)
    C_HEADER_BG = '#0F172A'       # Deep Navy Slate
    C_START_END = '#0F766E'       # Teal
    C_PROCESS = '#1E3A8A'         # Navy
    C_PROCESS_BG = '#F0F9FF'      # Clean Soft Blue Fill
    C_PROCESS_BD = '#0284C7'      # Vibrant Blue Border
    C_INPUT_BG = '#FEF3C7'        # Soft Amber Fill (Data Input)
    C_INPUT_BD = '#D97706'        # Amber Border
    C_DECISION = '#B45309'        # Deep Gold
    C_DECISION_BG = '#FFFBEB'     # Very Soft Yellow
    C_DECISION_BD = '#D97706'
    C_GIS_BG = '#F0FDF4'          # Soft Mint/Green Fill
    C_GIS_BD = '#16A34A'          # Green Border
    C_DB_BG = '#FAF5FF'           # Soft Purple Fill
    C_DB_BD = '#9333EA'           # Purple Border
    C_ALERT_BG = '#FEF2F2'        # Soft Red Fill
    C_ALERT_BD = '#DC2626'        # Red Border
    C_REPORT_BG = '#ECFDF5'       # Emerald Fill
    C_REPORT_BD = '#059669'
    C_TEXT = '#0F172A'
    C_MUTED = '#334155'
    C_ARROW = '#1E293B'

    # Reusable Shape Drawing Helpers
    def draw_shadow(pts, alpha=0.25):
        s_pts = pts + np.array([0.35, -0.35])
        ax.add_patch(MplPolygon(s_pts, closed=True, ec="none", fc="#94A3B8", alpha=alpha, zorder=2))

    def draw_pill(cx, cy, w, h, text, color=C_START_END):
        x, y = cx - w/2, cy - h/2
        shadow = FancyBboxPatch((x + 0.35, y - 0.35), w, h,
                                boxstyle=f"round,pad=0.2,rounding_size={h/2}",
                                ec="none", fc="#94A3B8", alpha=0.3, zorder=2)
        ax.add_patch(shadow)
        pill = FancyBboxPatch((x, y), w, h,
                              boxstyle=f"round,pad=0.2,rounding_size={h/2}",
                              ec=color, fc=color, lw=2.0, zorder=3)
        ax.add_patch(pill)
        ax.text(cx, cy, text, ha='center', va='center', fontsize=10.5,
                fontweight='bold', color='white', fontfamily=font_family, zorder=4)

    def draw_process(cx, cy, w, h, title, lines=[], badge="", bg=C_PROCESS_BG, bd=C_PROCESS_BD):
        x, y = cx - w/2, cy - h/2
        shadow = FancyBboxPatch((x + 0.35, y - 0.35), w, h,
                                boxstyle="round,pad=0.15,rounding_size=0.6",
                                ec="none", fc="#94A3B8", alpha=0.3, zorder=2)
        ax.add_patch(shadow)
        box = FancyBboxPatch((x, y), w, h,
                             boxstyle="round,pad=0.15,rounding_size=0.6",
                             ec=bd, fc=bg, lw=1.8, zorder=3)
        ax.add_patch(box)

        if badge:
            bw = len(badge) * 0.45 + 1.2
            bb = FancyBboxPatch((x + 0.8, y + h - 0.7), bw, 0.9,
                                boxstyle="round,pad=0.05,rounding_size=0.3",
                                ec="none", fc=bd, zorder=4)
            ax.add_patch(bb)
            ax.text(x + 0.8 + bw/2, y + h - 0.25, badge, ha='center', va='center',
                    fontsize=7.2, fontweight='bold', color='white', fontfamily=font_family, zorder=5)

        title_y = y + h - 1.2 if badge else y + h - 0.8
        ax.text(cx, title_y, title, ha='center', va='center',
                fontsize=9.5, fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)

        start_y = title_y - 0.65
        for i, line in enumerate(lines):
            ly = start_y - (i * 0.48)
            ax.text(x + 1.0, ly, "• " + line, ha='left', va='center',
                    fontsize=7.8, color=C_MUTED, fontfamily=font_family, zorder=4)

    def draw_parallelogram(cx, cy, w, h, title, lines=[], badge="", bg=C_INPUT_BG, bd=C_INPUT_BD):
        x, y = cx - w/2, cy - h/2
        skew = 1.2
        pts = np.array([
            [x + skew, y],
            [x + w + skew, y],
            [x + w - skew, y + h],
            [x - skew, y + h]
        ])
        draw_shadow(pts)
        poly = MplPolygon(pts, closed=True, ec=bd, fc=bg, lw=1.8, zorder=3)
        ax.add_patch(poly)

        if badge:
            bw = len(badge) * 0.45 + 1.2
            bb = FancyBboxPatch((x + 1.0, y + h - 0.7), bw, 0.9,
                                boxstyle="round,pad=0.05,rounding_size=0.3",
                                ec="none", fc=bd, zorder=4)
            ax.add_patch(bb)
            ax.text(x + 1.0 + bw/2, y + h - 0.25, badge, ha='center', va='center',
                    fontsize=7.2, fontweight='bold', color='white', fontfamily=font_family, zorder=5)

        title_y = y + h - 1.2 if badge else y + h - 0.8
        ax.text(cx, title_y, title, ha='center', va='center',
                fontsize=9.5, fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)

        start_y = title_y - 0.65
        for i, line in enumerate(lines):
            ly = start_y - (i * 0.48)
            ax.text(x + 1.5, ly, "• " + line, ha='left', va='center',
                    fontsize=7.8, color=C_MUTED, fontfamily=font_family, zorder=4)

    def draw_decision(cx, cy, w, h, title, sub=""):
        pts = np.array([
            [cx, cy + h/2],
            [cx + w/2, cy],
            [cx, cy - h/2],
            [cx - w/2, cy]
        ])
        draw_shadow(pts)
        poly = MplPolygon(pts, closed=True, ec=C_DECISION_BD, fc=C_DECISION_BG, lw=2.0, zorder=3)
        ax.add_patch(poly)

        if sub:
            ax.text(cx, cy + 0.35, title, ha='center', va='center',
                    fontsize=8.8, fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)
            ax.text(cx, cy - 0.55, sub, ha='center', va='center',
                    fontsize=7.5, color=C_MUTED, fontfamily=font_family, zorder=4)
        else:
            ax.text(cx, cy, title, ha='center', va='center',
                    fontsize=9.0, fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)

    def draw_database(cx, cy, w, h, title, lines=[]):
        x, y = cx - w/2, cy - h/2
        shadow = FancyBboxPatch((x + 0.35, y - 0.35), w, h,
                                boxstyle="round,pad=0.15,rounding_size=0.6",
                                ec="none", fc="#94A3B8", alpha=0.3, zorder=2)
        ax.add_patch(shadow)
        box = FancyBboxPatch((x, y), w, h,
                             boxstyle="round,pad=0.15,rounding_size=0.6",
                             ec=C_DB_BD, fc=C_DB_BG, lw=2.0, zorder=3)
        ax.add_patch(box)

        # Top bar
        tbar = FancyBboxPatch((x + 0.4, y + h - 0.9), w - 0.8, 0.75,
                              boxstyle="round,pad=0.05,rounding_size=0.3",
                              ec="none", fc=C_DB_BD, zorder=4)
        ax.add_patch(tbar)
        ax.text(cx, y + h - 0.52, "POSTGIS SPATIAL CLOUD DATABASE",
                ha='center', va='center', fontsize=6.8, fontweight='bold',
                color='white', fontfamily=font_family, zorder=5)

        title_y = y + h - 1.4
        ax.text(cx, title_y, title, ha='center', va='center',
                fontsize=9.5, fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)

        start_y = title_y - 0.65
        for i, line in enumerate(lines):
            ly = start_y - (i * 0.48)
            ax.text(x + 1.2, ly, "• " + line, ha='left', va='center',
                    fontsize=7.8, color=C_MUTED, fontfamily=font_family, zorder=4)

    def draw_arrow(p1, p2, label="", label_pos=0.5, color=C_ARROW, lw=1.8):
        ax.annotate('', xy=p2, xytext=p1,
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=lw,
                                    mutation_scale=14, shrinkA=3, shrinkB=3),
                    zorder=3)
        if label:
            lx = p1[0] + (p2[0] - p1[0]) * label_pos
            ly = p1[1] + (p2[1] - p1[1]) * label_pos
            ax.text(lx, ly, label, fontsize=7.8, fontweight='bold', color=color,
                    ha='center', va='center',
                    bbox=dict(boxstyle="round,pad=0.2", fc="white", ec="#CBD5E1", lw=1.0, alpha=0.98),
                    fontfamily=font_family, zorder=6)

    def draw_elbow(pts, label="", label_idx=0, color=C_ARROW, lw=1.8):
        for i in range(len(pts) - 1):
            if i == len(pts) - 2:
                ax.annotate('', xy=pts[i+1], xytext=pts[i],
                            arrowprops=dict(arrowstyle="-|>", color=color, lw=lw,
                                            mutation_scale=14, shrinkA=2, shrinkB=3),
                            zorder=3)
            else:
                ax.plot([pts[i][0], pts[i+1][0]], [pts[i][1], pts[i+1][1]],
                        color=color, lw=lw, zorder=3)
        if label:
            p1 = pts[label_idx]
            p2 = pts[label_idx + 1]
            lx = (p1[0] + p2[0]) / 2
            ly = (p1[1] + p2[1]) / 2
            ax.text(lx, ly, label, fontsize=7.8, fontweight='bold', color=color,
                    ha='center', va='center',
                    bbox=dict(boxstyle="round,pad=0.2", fc="white", ec="#CBD5E1", lw=1.0, alpha=0.98),
                    fontfamily=font_family, zorder=6)

    # =========================================================================
    # 1. HEADER TITLE BANNER
    # =========================================================================
    header_box = FancyBboxPatch((4.0, 93.8), 92.0, 4.8,
                                boxstyle="round,pad=0.2,rounding_size=0.5",
                                ec="#0F172A", fc=C_HEADER_BG, lw=1.5, zorder=4)
    ax.add_patch(header_box)
    ax.text(50.0, 96.9, "MUNICIPAL AGRICULTURE OFFICE (MAO) — SILAGO, SOUTHERN LEYTE",
            ha='center', va='center', fontsize=11.5, fontweight='bold', color='#38BDF8',
            fontfamily=font_family, zorder=5)
    ax.text(50.0, 95.0, "Figure 2: End-to-End Process Flow and Parcel Georeferencing Lifecycle",
            ha='center', va='center', fontsize=14.0, fontweight='bold', color='white',
            fontfamily=font_family, zorder=5)

    # =========================================================================
    # 2. START NODE & USER AUTHENTICATION GATE
    # =========================================================================
    draw_pill(50.0, 91.2, 34.0, 2.2, "START: Launch Silago Rice GIS Web Portal", C_START_END)
    draw_arrow((50.0, 90.1), (50.0, 87.8))

    draw_decision(50.0, 85.5, 24.0, 4.6, "User Authentication?", "Role-Based Access Control (RBAC)")

    # Guest / Public Route (Left Branch)
    draw_elbow([(38.0, 85.5), (18.0, 85.5), (18.0, 81.5)], label="Guest / Public", color=C_ARROW)
    draw_process(18.0, 77.8, 22.0, 5.0, "Public Portal Services", [
        "Read-Only GIS Map View",
        "Search Rice Variety Catalog",
        "Open-Meteo Weather Radar",
        "Gemini RiceSsistant Chatbot"
    ], badge="PUBLIC ACCESS", bg="#F1F5F9", bd="#94A3B8")
    draw_pill(18.0, 73.2, 20.0, 2.0, "END: Public Session Idle", "#64748B")
    draw_arrow((18.0, 75.3), (18.0, 74.2))

    # Authenticated Route (Center Downward Path)
    draw_arrow((50.0, 83.2), (50.0, 79.8), label="MAO Admin / LFT Officer", color=C_GIS_BD)

    # =========================================================================
    # 3. FARMER SEARCH & RSBSA VERIFICATION
    # =========================================================================
    draw_parallelogram(50.0, 77.2, 28.0, 5.2, "Step 1: Farmer RSBSA Search", [
        "Inquire National RSBSA ID Number",
        "Search Farmer Family Name / Mobile",
        "Verify Registration Requirements"
    ], badge="FARMER INQUIRY", bg=C_INPUT_BG, bd=C_INPUT_BD)
    draw_arrow((50.0, 74.6), (50.0, 71.8))

    draw_decision(50.0, 69.5, 22.0, 4.6, "Record Exists in DB?", "Search rice_farm_records")

    # New Farmer Registration (Right Branch)
    draw_elbow([(61.0, 69.5), (82.0, 69.5), (82.0, 65.5)], label="No (New Farmer)", color=C_DECISION_BD)
    draw_parallelogram(82.0, 61.8, 24.0, 5.8, "New Farmer Registration", [
        "Input Demographics (DOB, Sex, Contact)",
        "Residential Address & Barangay/Purok",
        "Declare Tenurial Status:",
        "  Owner-Cultivator, Tenant, ARB, Lessee",
        "Upload Farmer 2x2 ID Photo"
    ], badge="NEW PROFILE", bg=C_INPUT_BG, bd=C_INPUT_BD)
    draw_elbow([(82.0, 58.9), (82.0, 54.8), (64.0, 54.8)], color=C_DECISION_BD)

    # Existing Farmer Found (Center Path)
    draw_arrow((50.0, 67.2), (50.0, 63.8), label="Yes (Found)", color=C_GIS_BD)
    draw_process(50.0, 61.2, 26.0, 5.0, "Step 2: Load Farmer Profile", [
        "Retrieve Existing Farm Parcels",
        "Verify RSBSA Masterlist Status",
        "Review Historic Cropping Records"
    ], badge="PROFILE RETRIEVED", bg=C_PROCESS_BG, bd=C_PROCESS_BD)
    draw_arrow((50.0, 58.7), (50.0, 56.0))

    # Merge point at (50, 56)
    draw_arrow((50.0, 56.0), (50.0, 53.6))

    # =========================================================================
    # 4. GIS NAVIGATION & VECTOR PARCEL DELINEATION
    # =========================================================================
    draw_process(50.0, 51.0, 28.0, 5.2, "Step 3: Barangay Workspace & Basemap", [
        "Select from 15 Silago Barangays",
        "Load GeoJSON Administrative Boundary",
        "Toggle Esri Satellite / Google Hybrid / Topo"
    ], badge="SPATIAL NAVIGATION", bg=C_GIS_BG, bd=C_GIS_BD)
    draw_arrow((50.0, 48.4), (50.0, 45.8))

    draw_process(50.0, 42.8, 28.0, 5.8, "Step 4: Vector Polygon Delineation", [
        "Technician traces boundary GPS vertices [lat, lng]",
        "Follow field bunds (pilapil) & irrigation turn-out",
        "Capture geotagged parcel field photo",
        "Real-time Geodesic Area Calculation (Hectares)"
    ], badge="VECTOR TRACING", bg=C_GIS_BG, bd=C_GIS_BD)
    draw_arrow((50.0, 39.9), (50.0, 36.8))

    # =========================================================================
    # 5. SPATIAL TOPOLOGY AUDIT & OVERLAP RESOLUTION
    # =========================================================================
    draw_decision(50.0, 34.5, 24.0, 4.6, "Spatial Conflict Audit?", "PostGIS ST_Intersects")

    # Conflict / Overlap Loop (Right Branch)
    draw_elbow([(62.0, 34.5), (82.0, 34.5), (82.0, 39.0)], label="Overlap > 0.01%", color=C_ALERT_BD)
    draw_process(82.0, 42.5, 24.0, 5.4, "Spatial Conflict Warning", [
        "ALERT: Overlap Detected with Neighbor!",
        "Highlight overlapping boundary in red",
        "Display conflicting Parcel Tag & Owner",
        "Adjust vertices or re-survey field"
    ], badge="TOPOLOGY WARNING", bg=C_ALERT_BG, bd=C_ALERT_BD)
    draw_elbow([(82.0, 45.2), (82.0, 46.8), (64.0, 46.8), (64.0, 44.5)], label="Re-trace Boundary", color=C_ALERT_BD)

    # Passed Audit (Center Path)
    draw_arrow((50.0, 32.2), (50.0, 28.8), label="Passed (No Conflict)", color=C_GIS_BD)

    # =========================================================================
    # 6. ATTRIBUTES & POSTGIS CLOUD PERSISTENCE
    # =========================================================================
    draw_parallelogram(50.0, 26.0, 28.0, 5.6, "Step 5: Attribute Data Entry", [
        "Assign Parcel Tag Number (e.g. SLG-BLG-101)",
        "Select Rice Variety: Inbred (Rc 222) / Hybrid (Rc 488H)",
        "Ecosystem: Irrigated NIA / Rainfed Lowland / Upland",
        "Water Source / Irrigators Assoc (Balagawan CIA)",
        "Input Planting Date & Cropping Season (WS / DS)"
    ], badge="CROP ATTRIBUTES", bg=C_INPUT_BG, bd=C_INPUT_BD)
    draw_arrow((50.0, 23.2), (50.0, 20.4))

    draw_database(50.0, 17.5, 30.0, 5.6, "Step 6: Supabase PostgreSQL & PostGIS Commit", [
        "Commit spatial polygon to 'farm_parcels' (GIST Index)",
        "Insert demographic linkage in 'rice_farm_records'",
        "Upload geotagged photos to Supabase Storage",
        "Broadcast Real-time WebSocket to MAO Workstations"
    ])
    draw_arrow((50.0, 14.7), (50.0, 11.8))

    # =========================================================================
    # 7. MONITORING, CERTIFICATION & EXPORTS
    # =========================================================================
    draw_process(50.0, 9.2, 30.0, 5.2, "Step 7: Seasonal Tracking & Harvest Yield", [
        "Track Growth Stages (DAS: Seedling -> Tillering -> Harvest)",
        "Record Actual Yield in 50-kg Cavans, MT, and Gross Income ₱",
        "Google Gemini 2.5 Flash AI Pest & Disease Diagnosis"
    ], badge="SEASONAL MONITORING", bg=C_REPORT_BG, bd=C_REPORT_BD)
    draw_arrow((50.0, 6.6), (50.0, 4.0))

    # Final Two Outcomes (Side-by-side)
    draw_elbow([(50.0, 4.0), (33.0, 4.0), (33.0, 2.5)], color=C_REPORT_BD)
    draw_elbow([(50.0, 4.0), (67.0, 4.0), (67.0, 2.5)], color=C_START_END)

    draw_process(33.0, 1.2, 26.0, 2.6, "Official Reports & Masterlists", [
        "PDF Official MAO Registration Certificates",
        "Excel (.xlsx) & CSV DA Submissions"
    ], badge="OUTPUTS", bg=C_REPORT_BG, bd=C_REPORT_BD)

    draw_pill(67.0, 1.2, 26.0, 2.6, "END: Parcel Registered & Synced", C_START_END)

    # =========================================================================
    # 8. SYMBOLOGY LEGEND (Left Side Bottom)
    # =========================================================================
    leg_x, leg_y, leg_w, leg_h = 4.0, 14.0, 18.0, 14.5
    leg_bg = FancyBboxPatch((leg_x, leg_y), leg_w, leg_h,
                            boxstyle="round,pad=0.2,rounding_size=0.5",
                            ec="#CBD5E1", fc="#F8FAFC", lw=1.2, zorder=3)
    ax.add_patch(leg_bg)
    ax.text(leg_x + leg_w/2, leg_y + leg_h - 1.0, "FLOWCHART SYMBOLS",
            ha='center', va='center', fontsize=8.5, fontweight='bold', color=C_TEXT,
            fontfamily=font_family, zorder=4)

    legend_items = [
        ("Start / End Terminal", C_START_END, "pill"),
        ("System Action / Process", C_PROCESS_BD, "rect"),
        ("User Input / Data Entry", C_INPUT_BD, "para"),
        ("Audit / Decision Gate", C_DECISION_BD, "diamond"),
        ("GIS Spatial Vector Operation", C_GIS_BD, "rect_gis"),
        ("PostGIS Spatial Database", C_DB_BD, "db"),
        ("Topology Conflict Alert", C_ALERT_BD, "rect_alert"),
        ("Official Report / Certificate", C_REPORT_BD, "rect_rep"),
    ]
    for idx, (lbl, col, shp) in enumerate(legend_items):
        iy = leg_y + leg_h - 2.4 - (idx * 1.45)
        if shp == 'pill':
            p = FancyBboxPatch((leg_x + 1.0, iy - 0.35), 2.8, 0.7, boxstyle="round,pad=0.08,rounding_size=0.35",
                               ec=col, fc=col, zorder=4)
            ax.add_patch(p)
        elif shp == 'rect':
            p = FancyBboxPatch((leg_x + 1.0, iy - 0.35), 2.8, 0.7, boxstyle="round,pad=0.08,rounding_size=0.15",
                               ec=col, fc=C_PROCESS_BG, lw=1.2, zorder=4)
            ax.add_patch(p)
        elif shp == 'para':
            pts = np.array([[leg_x + 1.4, iy - 0.35], [leg_x + 3.8, iy - 0.35],
                            [leg_x + 3.4, iy + 0.35], [leg_x + 1.0, iy + 0.35]])
            ax.add_patch(MplPolygon(pts, closed=True, ec=col, fc=C_INPUT_BG, lw=1.2, zorder=4))
        elif shp == 'diamond':
            d_pts = np.array([[leg_x + 2.4, iy + 0.35], [leg_x + 3.6, iy],
                              [leg_x + 2.4, iy - 0.35], [leg_x + 1.2, iy]])
            ax.add_patch(MplPolygon(d_pts, closed=True, ec=col, fc=C_DECISION_BG, lw=1.2, zorder=4))
        elif shp == 'rect_gis':
            p = FancyBboxPatch((leg_x + 1.0, iy - 0.35), 2.8, 0.7, boxstyle="round,pad=0.08,rounding_size=0.15",
                               ec=col, fc=C_GIS_BG, lw=1.2, zorder=4)
            ax.add_patch(p)
        elif shp == 'db':
            p = FancyBboxPatch((leg_x + 1.0, iy - 0.35), 2.8, 0.7, boxstyle="round,pad=0.08,rounding_size=0.15",
                               ec=col, fc=C_DB_BG, lw=1.2, zorder=4)
            ax.add_patch(p)
        elif shp == 'rect_alert':
            p = FancyBboxPatch((leg_x + 1.0, iy - 0.35), 2.8, 0.7, boxstyle="round,pad=0.08,rounding_size=0.15",
                               ec=col, fc=C_ALERT_BG, lw=1.2, zorder=4)
            ax.add_patch(p)
        elif shp == 'rect_rep':
            p = FancyBboxPatch((leg_x + 1.0, iy - 0.35), 2.8, 0.7, boxstyle="round,pad=0.08,rounding_size=0.15",
                               ec=col, fc=C_REPORT_BG, lw=1.2, zorder=4)
            ax.add_patch(p)

        ax.text(leg_x + 4.6, iy, lbl, ha='left', va='center', fontsize=7.2,
                fontweight='normal', color=C_TEXT, fontfamily=font_family, zorder=4)

    plt.tight_layout(pad=0.8)
    plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Successfully generated clean academic flowchart at: {output_path}")

if __name__ == '__main__':
    out_img = 'academic_clean_flowchart.png'
    create_clean_academic_flowchart(out_img)

    # Copy to Downloads and Brain
    artifact_dir = r"C:\Users\Admin\.gemini\antigravity\brain\ba0169cb-168c-413d-935a-5719f4fe7b33"
    downloads_dir = r"C:\Users\Admin\Downloads"

    for dest in [downloads_dir, artifact_dir]:
        if os.path.exists(dest):
            shutil.copy(out_img, os.path.join(dest, out_img))
            print(f"Copied {out_img} to {dest}")
