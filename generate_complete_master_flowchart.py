import os
import shutil
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Polygon as MplPolygon
import numpy as np

font_family = 'Segoe UI'

def create_unabridged_master_flowchart(output_path):
    # Massive high-res canvas (28 x 46 inches at 200 DPI = 5600 x 9200 pixels)
    fig = plt.figure(figsize=(28, 46), dpi=200, facecolor='#F8FAFC')
    ax = fig.add_subplot(111)
    ax.set_facecolor('#F8FAFC')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Color Palette
    C_HEADER_MAIN = '#0F172A'
    C_TEXT = '#0F172A'
    C_MUTED = '#475569'
    C_ARROW = '#334155'
    C_CARD_BG = '#FFFFFF'

    # 4 Swimlanes Configuration
    lanes = [
        {
            'title': '1. MAGSASAKA / PUBLIC VIEWER',
            'role': 'Beneficiary, RSBSA Applicant & Citizen Inquiries',
            'x1': 3.2, 'w': 22.8,
            'header_color': '#C2410C', # Deep Amber/Orange
            'bg_color': '#FFF7ED',
            'border_color': '#FDBA74'
        },
        {
            'title': '2. LOCAL FARMER TECHNICIAN (LFT)',
            'role': 'Field Mapper, GPS Surveyor & Crop Phenology Inspector',
            'x1': 27.2, 'w': 22.8,
            'header_color': '#1D4ED8', # Deep Blue
            'bg_color': '#EFF6FF',
            'border_color': '#93C5FD'
        },
        {
            'title': '3. MAO ADMINISTRATOR',
            'role': 'Municipal Agriculturist, Dispute Mediator & Certifier',
            'x1': 51.2, 'w': 22.8,
            'header_color': '#4338CA', # Deep Indigo
            'bg_color': '#EEF2FF',
            'border_color': '#A5B4FC'
        },
        {
            'title': '4. SPATIAL GIS ENGINE & DATABASE',
            'role': 'PostGIS Spatial Query Engine, Supabase, Gemini AI',
            'x1': 75.2, 'w': 22.8,
            'header_color': '#15803D', # Deep Emerald
            'bg_color': '#F0FDF4',
            'border_color': '#86EFAC'
        }
    ]

    lane_top = 95.8
    lane_bottom = 1.0
    lane_h = lane_top - lane_bottom

    # Draw Swimlane Background Columns
    for lane in lanes:
        bg = FancyBboxPatch((lane['x1'], lane_bottom), lane['w'], lane_h,
                            boxstyle="round,pad=0.1,rounding_size=0.4",
                            ec=lane['border_color'], fc=lane['bg_color'], lw=1.5, zorder=1)
        ax.add_patch(bg)

        hb = FancyBboxPatch((lane['x1'], lane_top - 2.5), lane['w'], 2.5,
                            boxstyle="round,pad=0.05,rounding_size=0.3",
                            ec="none", fc=lane['header_color'], zorder=3)
        ax.add_patch(hb)

        ax.text(lane['x1'] + lane['w'] / 2, lane_top - 0.95, lane['title'],
                ha='center', va='center', fontsize=9.2, fontweight='bold',
                color='white', fontfamily=font_family, zorder=4)
        ax.text(lane['x1'] + lane['w'] / 2, lane_top - 1.85, lane['role'],
                ha='center', va='center', fontsize=7.2, fontweight='normal',
                color='#F1F5F9', fontfamily=font_family, zorder=4)

    # MASTER TOP BANNER
    banner = FancyBboxPatch((3.2, 96.5), 94.8, 3.0,
                            boxstyle="round,pad=0.15,rounding_size=0.4",
                            ec="#0F172A", fc=C_HEADER_MAIN, lw=1.5, zorder=5)
    ax.add_patch(banner)
    ax.text(50.6, 98.4, "MUNICIPAL AGRICULTURE OFFICE (MAO) — LOCAL GOVERNMENT UNIT OF SILAGO, SOUTHERN LEYTE",
            ha='center', va='center', fontsize=11.5, fontweight='bold', color='#38BDF8',
            fontfamily=font_family, zorder=6)
    ax.text(50.6, 97.2, "COMPLETE END-TO-END RICE FARM REGISTRY & GEOREFERENCING GIS SYSTEM OPERATIONAL FLOWCHART",
            ha='center', va='center', fontsize=13.0, fontweight='bold', color='white',
            fontfamily=font_family, zorder=6)

    # 9 Distinct Operational Phases
    phase_markers = [
        ("STAGE 1: Portal Access & Multi-Role Authentication", 92.5),
        ("STAGE 2: Farmer Identity & RSBSA Registry Profiling", 82.5),
        ("STAGE 3: Barangay Workspace & Base Layer Navigation", 72.0),
        ("STAGE 4: Vector Polygon Delineation & Field Evidence", 61.5),
        ("STAGE 5: PostGIS Spatial Overlap Conflict Audit", 50.5),
        ("STAGE 6: Attribute Entry, Tenurial Status & Persistence", 39.5),
        ("STAGE 7: Seasonal Phenology & Growth Stage Monitoring", 28.5),
        ("STAGE 8: Harvest Yield Computation & Pest Advisory", 17.5),
        ("STAGE 9: Official MAO Certification & DA Masterlists", 7.0),
    ]

    for p_label, py in phase_markers:
        ax.plot([3.2, 98.0], [py + 2.8, py + 2.8], color='#94A3B8', linestyle='--', lw=1.0, alpha=0.6, zorder=2)
        badge = FancyBboxPatch((0.4, py + 2.2), 2.5, 1.2, boxstyle="round,pad=0.08,rounding_size=0.25",
                               ec="#334155", fc="#0F172A", zorder=6)
        ax.add_patch(badge)
        s_num = p_label.split(':')[0].replace('STAGE ', 'S')
        ax.text(1.65, py + 2.8, s_num, ha='center', va='center', fontsize=7.2,
                fontweight='bold', color='#38BDF8', fontfamily=font_family, zorder=7)

    # Reusable Draw Helpers
    def draw_box(x, y, w, h, title, lines=[], badge="", badge_color="#2563EB", border_color="#CBD5E1", bg_color=C_CARD_BG):
        # Shadow
        shadow = FancyBboxPatch((x + 0.2, y - 0.2), w, h,
                                boxstyle="round,pad=0.1,rounding_size=0.4",
                                ec="none", fc="#94A3B8", alpha=0.3, zorder=2)
        ax.add_patch(shadow)

        box = FancyBboxPatch((x, y), w, h,
                             boxstyle="round,pad=0.1,rounding_size=0.4",
                             ec=border_color, fc=bg_color, lw=1.4, zorder=3)
        ax.add_patch(box)

        # Badge
        if badge:
            bw = len(badge) * 0.42 + 1.2
            bb = FancyBboxPatch((x + 0.5, y + h - 0.55), bw, 0.75,
                                boxstyle="round,pad=0.04,rounding_size=0.2",
                                ec="none", fc=badge_color, zorder=4)
            ax.add_patch(bb)
            ax.text(x + 0.5 + bw/2, y + h - 0.18, badge, ha='center', va='center',
                    fontsize=6.0, fontweight='bold', color='white', fontfamily=font_family, zorder=5)

        # Title
        title_y = y + h - 0.95 if badge else y + h - 0.65
        ax.text(x + w / 2, title_y, title, ha='center', va='center',
                fontsize=8.0, fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)

        # Body Bullet Lines
        start_y = title_y - 0.55
        for i, line in enumerate(lines):
            ly = start_y - (i * 0.42)
            ax.text(x + 0.8, ly, "• " + line, ha='left', va='center',
                    fontsize=6.8, color=C_MUTED, fontfamily=font_family, zorder=4)

    def draw_decision(cx, cy, w, h, title, sub="", border_color="#D97706", bg_color="#FEF3C7"):
        s_pts = np.array([[cx + 0.2, cy + h/2 - 0.2], [cx + w/2 + 0.2, cy - 0.2],
                          [cx + 0.2, cy - h/2 - 0.2], [cx - w/2 + 0.2, cy - 0.2]])
        ax.add_patch(MplPolygon(s_pts, closed=True, ec="none", fc="#94A3B8", alpha=0.3, zorder=2))

        pts = np.array([[cx, cy + h/2], [cx + w/2, cy], [cx, cy - h/2], [cx - w/2, cy]])
        diamond = MplPolygon(pts, closed=True, ec=border_color, fc=bg_color, lw=1.6, zorder=3)
        ax.add_patch(diamond)

        if sub:
            ax.text(cx, cy + 0.25, title, ha='center', va='center', fontsize=7.4,
                    fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)
            ax.text(cx, cy - 0.35, sub, ha='center', va='center', fontsize=6.3,
                    color=C_MUTED, fontfamily=font_family, zorder=4)
        else:
            ax.text(cx, cy, title, ha='center', va='center', fontsize=7.4,
                    fontweight='bold', color=C_TEXT, fontfamily=font_family, zorder=4)

    def draw_pill(x, y, w, h, text, color="#0F766E"):
        shadow = FancyBboxPatch((x + 0.2, y - 0.2), w, h,
                                boxstyle="round,pad=0.15,rounding_size=0.8",
                                ec="none", fc="#94A3B8", alpha=0.3, zorder=2)
        ax.add_patch(shadow)
        pill = FancyBboxPatch((x, y), w, h,
                              boxstyle="round,pad=0.15,rounding_size=0.8",
                              ec=color, fc=color, lw=1.4, zorder=3)
        ax.add_patch(pill)
        ax.text(x + w / 2, y + h / 2, text, ha='center', va='center',
                fontsize=7.8, fontweight='bold', color='white', fontfamily=font_family, zorder=4)

    def draw_arrow(p1, p2, label="", label_pos=0.5, color=C_ARROW, lw=1.5):
        ax.annotate('', xy=p2, xytext=p1,
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=lw,
                                    mutation_scale=11, shrinkA=2, shrinkB=2),
                    zorder=3)
        if label:
            lx = p1[0] + (p2[0] - p1[0]) * label_pos
            ly = p1[1] + (p2[1] - p1[1]) * label_pos
            ax.text(lx, ly, label, fontsize=6.6, fontweight='bold', color=color,
                    ha='center', va='center',
                    bbox=dict(boxstyle="round,pad=0.12", fc="white", ec="#CBD5E1", lw=0.8, alpha=0.95),
                    fontfamily=font_family, zorder=6)

    def draw_elbow(pts, label="", label_idx=0, color=C_ARROW, lw=1.5):
        for i in range(len(pts) - 1):
            if i == len(pts) - 2:
                ax.annotate('', xy=pts[i+1], xytext=pts[i],
                            arrowprops=dict(arrowstyle="-|>", color=color, lw=lw,
                                            mutation_scale=11, shrinkA=2, shrinkB=2),
                            zorder=3)
            else:
                ax.plot([pts[i][0], pts[i+1][0]], [pts[i][1], pts[i+1][1]],
                        color=color, lw=lw, zorder=3)
        if label:
            p1 = pts[label_idx]
            p2 = pts[label_idx + 1]
            lx = (p1[0] + p2[0]) / 2
            ly = (p1[1] + p2[1]) / 2
            ax.text(lx, ly, label, fontsize=6.6, fontweight='bold', color=color,
                    ha='center', va='center',
                    bbox=dict(boxstyle="round,pad=0.12", fc="white", ec="#CBD5E1", lw=0.8, alpha=0.95),
                    fontfamily=font_family, zorder=6)

    # =========================================================================
    # STAGE 1: PORTAL ACCESS & MULTI-ROLE AUTHENTICATION (Y: 95 to 85)
    # =========================================================================
    # Lane 1: Public Farmer / Citizen
    draw_pill(5.0, 93.0, 19.2, 1.8, "START 1A: Public Access Web Portal", "#C2410C")
    draw_box(5.0, 87.8, 19.2, 4.6, "Public Portal Landing Page", [
        "View General Municipal Rice Registry",
        "Search Farmer Verification by RSBSA No.",
        "Interactive Read-Only Silago Map",
        "Check Live Open-Meteo Weather Radar",
        "Inquire with RiceSsistant AI Chatbot"
    ], badge="PUBLIC CLIENT", badge_color="#EA580C", border_color="#FDBA74")
    draw_arrow((14.6, 93.0), (14.6, 92.4))

    draw_pill(5.0, 85.0, 19.2, 1.6, "END: Public Citizen Session Concluded", "#64748B")
    draw_arrow((14.6, 87.8), (14.6, 86.6))

    # Lane 2: LFT Officer
    draw_pill(29.0, 93.0, 19.2, 1.8, "START 1B: LFT Field Mapper Login", "#1D4ED8")
    draw_box(29.0, 87.5, 19.2, 4.9, "LFT Mobile / Web Authentication", [
        "Input LFT Assigned Username / Password",
        "Optional SMS OTP Phone Verification",
        "Bind session to assigned Silago Barangay",
        "(e.g., Balagawan, Hingatungan, Tubod)",
        "Request Authorized Access Token"
    ], badge="FIELD LOGIN", badge_color="#2563EB", border_color="#93C5FD")
    draw_arrow((38.6, 93.0), (38.6, 92.4))

    # Lane 3: MAO Admin
    draw_pill(53.0, 93.0, 19.2, 1.8, "START 1C: MAO Master Login", "#4338CA")
    draw_box(53.0, 87.5, 19.2, 4.9, "Municipal Agriculturist Portal", [
        "Input Administrator Master Credentials",
        "System Security & Session Token Init",
        "Full CRUD Privileges & Settings Access",
        "Manage LFT Accounts & Assignments",
        "Access Certification & Signing Engine"
    ], badge="ADMIN LOGIN", badge_color="#4F46E5", border_color="#A5B4FC")
    draw_arrow((62.6, 93.0), (62.6, 92.4))

    # Lane 4: System Authentication Engine
    draw_decision(86.6, 89.9, 18.2, 3.8, "Validate JWT & RBAC?", "Supabase Auth Check",
                  border_color="#15803D", bg_color="#DCFCE7")
    draw_arrow((48.2, 89.9), (77.5, 89.9), label="LFT Token Request", color="#1D4ED8")
    draw_arrow((72.2, 89.9), (77.5, 89.9), color="#4338CA")

    # Auth Failure Loop
    draw_elbow([(86.6, 91.8), (86.6, 94.2), (48.2, 94.2), (48.2, 92.0)], label="Denied: Re-enter Credentials", color="#DC2626")

    # =========================================================================
    # STAGE 2: FARMER IDENTITY & RSBSA PROFILING (Y: 85 to 74)
    # =========================================================================
    # Lane 1: Farmer Personal Submission
    draw_box(5.0, 77.2, 19.2, 5.8, "Farmer Documents & Tenancy Proof", [
        "Submit Personal Demographics (DOB, Sex)",
        "Present National Gov ID / Barangay Cert",
        "Provide RSBSA ID Registration Form",
        "Declare Tenurial Status Documentation:",
        "  - Owner: Land Title / Tax Dec",
        "  - Tenant: Landowner Sharing Agreement",
        "  - ARB: CLOA Certificate of Ownership"
    ], badge="APPLICATION", badge_color="#C2410C", border_color="#FDBA74")

    # Lane 2: LFT Record Search
    draw_box(29.0, 77.2, 19.2, 5.8, "Search & Input Farmer Demographics", [
        "Inquire National RSBSA Registration No.",
        "Search Farmer Family Name in Database",
        "Capture / Upload Farmer 2x2 Photo",
        "Encode Residential Address & Purok",
        "Assign Local Contact Mobile Number",
        "Send Record Verification Query to DB"
    ], badge="REGISTRY MODULE", badge_color="#1D4ED8", border_color="#93C5FD")
    draw_arrow((24.2, 80.1), (29.0, 80.1), label="Submit Docs", color="#C2410C")

    # Lane 4: Database Search
    draw_decision(86.6, 80.1, 18.2, 4.0, "Farmer Exists in DB?", "Check rice_farm_records",
                  border_color="#D97706", bg_color="#FEF3C7")
    draw_arrow((48.2, 80.1), (77.5, 80.1), label="Query RSBSA", color="#1D4ED8")

    # Lane 3: Admin Review & New Farmer Creation
    draw_box(53.0, 77.2, 19.2, 5.8, "Audit Demographics & Tenure", [
        "MAO Officer verifies RSBSA legitimacy",
        "Cross-reference Municipal Farmer Roster",
        "Authorize Farmer Profile Creation",
        "Classify Agrarian Legal Standing:",
        "  (Owner-Cultivator / Tenant / Lessee)",
        "Approve Farmer Entry for Mapping"
    ], badge="MAO AUDIT", badge_color="#4338CA", border_color="#A5B4FC")
    draw_arrow((77.5, 80.1), (72.2, 80.1), label="Found", color="#15803D")
    draw_elbow([(86.6, 78.1), (86.6, 75.0), (38.6, 75.0), (38.6, 77.2)], label="New: Create New Profile", color="#D97706")

    # =========================================================================
    # STAGE 3: BARANGAY WORKSPACE & BASE LAYER NAVIGATION (Y: 74 to 63)
    # =========================================================================
    # Lane 2: LFT GIS Navigation
    draw_box(29.0, 65.5, 19.2, 6.2, "Barangay Spatial Selection & Setup", [
        "Select target Barangay from Silago (15):",
        "  Poblacion 1 & 2, Balagawan, Hingatungan,",
        "  Tubod, Mercedes, Salvacion, Katipunan,",
        "  Guintoma-an, Puntana, Imelda, Lagoma,",
        "  Tuba-on, San Roque, Sudmon",
        "Load Barangay GeoJSON Vector Boundary",
        "Zoom to specific Purok / Sitio Farm Zone"
    ], badge="WORKSPACE GIS", badge_color="#059669", border_color="#6EE7B7")
    draw_arrow((38.6, 77.2), (38.6, 71.7))

    # Lane 4: Map Layer Services
    draw_box(75.2, 65.5, 22.8, 6.2, "Geospatial Tile & Vector Feeds", [
        "Leaflet.js Map Rendering Engine:",
        "• Esri World Imagery (Satellite Tiles)",
        "• Google Hybrid Layer (Roads + Canopy)",
        "• OpenStreetMap Topo Layer",
        "• Municipal & Barangay Shapefile Layers",
        "• Pre-existing Registered Farm Parcels",
        "• NIA Irrigation Canals & River Networks"
    ], badge="GIS TILE SERVERS", badge_color="#15803D", border_color="#86EFAC")
    draw_arrow((48.2, 68.6), (75.2, 68.6), label="Request Layers", color="#059669")

    # Lane 1: Farmer Ground Guidance
    draw_box(5.0, 65.5, 19.2, 6.2, "Field Boundary Ground Guidance", [
        "Farmer guides LFT to actual farm location",
        "Identifies boundary pilapil (levees)",
        "Identifies irrigation inlet / turn-out",
        "Identifies adjacent neighboring tillers",
        "Confirms boundary trees / monuments"
    ], badge="FIELD SURVEY", badge_color="#C2410C", border_color="#FDBA74")
    draw_arrow((24.2, 68.6), (29.0, 68.6), label="Confirm Location", color="#C2410C")

    # =========================================================================
    # STAGE 4: VECTOR POLYGON DELINEATION & EVIDENCE (Y: 63 to 52)
    # =========================================================================
    # Lane 2: Vector Tracing
    draw_box(29.0, 54.0, 19.2, 6.6, "Interactive Polygon Vector Tracing", [
        "Activate Leaflet.draw Vector Tool",
        "Trace perimeter GPS vertices [lat, lng]",
        "Follow exact rice bunds & waterlines",
        "Fine-tune: Drag vertex / snap to border",
        "Capture Geotagged Parcel Field Photo",
        "Embed Photo EXIF GPS Metadata",
        "Submit Geometry for Spatial Validation"
    ], badge="VECTOR DELINEATION", badge_color="#0284C7", border_color="#7DD3FC")
    draw_arrow((38.6, 65.5), (38.6, 60.6))

    # Lane 4: Geodesic Calculation Engine
    draw_box(75.2, 54.0, 22.8, 6.6, "Geodesic Land Area Computation", [
        "Turf.js Geodesic Polygon Area Calculation",
        "PostGIS WGS84 (EPSG:4326) Spherical Math",
        "Convert square meters to Hectares (ha):",
        "  areaHa = Math.round(sqm / 10000 * 100) / 100",
        "Compute Parcel Centroid Coordinates",
        "Determine Farm Scale Category:",
        "  (<2.0 ha: Smallholder | 2-5 ha: Medium | >5 ha: Comm)"
    ], badge="GEODESIC ENGINE", badge_color="#15803D", border_color="#86EFAC")
    draw_arrow((48.2, 57.3), (75.2, 57.3), label="Stream GPS Vertices", color="#0284C7")

    # Lane 3: Admin Real-time Visual Inspection
    draw_box(53.0, 54.0, 19.2, 6.6, "Live Spatial Workstation Mirror", [
        "MAO Admin observes field polygon stream",
        "Inspects alignment with Satellite Imagery",
        "Checks Barangay perimeter containment",
        "Observes field photo geotag location",
        "Monitors surveyor accuracy metrics"
    ], badge="MONITORING", badge_color="#4338CA", border_color="#A5B4FC")
    draw_arrow((75.2, 57.3), (72.2, 57.3), color="#15803D")

    # =========================================================================
    # STAGE 5: POSTGIS SPATIAL OVERLAP CONFLICT AUDIT (Y: 52 to 41)
    # =========================================================================
    # Lane 4: PostGIS Conflict Check
    draw_decision(86.6, 45.8, 18.2, 4.4, "Overlap Conflict Check?", "PostGIS ST_Intersects",
                  border_color="#DC2626", bg_color="#FEF2F2")
    draw_arrow((86.6, 54.0), (86.6, 48.0), label="Run ST_Intersects", color="#15803D")

    # Lane 2: Spatial Conflict Warning Alert
    draw_box(29.0, 42.8, 19.2, 6.2, "Spatial Conflict Warning Prompt", [
        "ALERT: Overlap Detected with Neighbor!",
        "Highlight overlapping slice in red",
        "Display conflicting Parcel Tag & Owner",
        "Display overlapping area (m² / ha)",
        "ACTIONS:",
        "  • Adjust vertices to snap to edge",
        "  • Re-survey field boundary with neighbor"
    ], badge="CONFLICT WARNING", badge_color="#DC2626", border_color="#FCA5A5")
    draw_arrow((77.5, 45.8), (48.2, 45.8), label="Overlap > 0.01%", color="#DC2626")
    draw_elbow([(38.6, 49.0), (38.6, 54.0)], label="Re-trace / Adjust Vertices", color="#DC2626")

    # Lane 3: Dispute Mediation
    draw_box(53.0, 42.8, 19.2, 6.2, "Agrarian Boundary Dispute Mediation", [
        "Summon concerned farmers to MAO Silago",
        "Review historical tax declarations & maps",
        "Coordinate with Barangay Agrarian Committee",
        "Establish mutually agreed boundary line",
        "Authorize official vertex realignment"
    ], badge="DISPUTE RESOLUTION", badge_color="#4338CA", border_color="#A5B4FC")
    draw_arrow((29.0, 45.8), (24.2, 45.8), color="#DC2626")
    draw_elbow([(48.2, 44.0), (53.0, 44.0)], label="Escalate to MAO", color="#4338CA")

    # Valid Geometry Path
    draw_arrow((86.6, 43.6), (86.6, 38.5), label="No Overlap (Approved)", color="#15803D")

    # =========================================================================
    # STAGE 6: ATTRIBUTE ENTRY, TENURIAL STATUS & PERSISTENCE (Y: 41 to 30)
    # =========================================================================
    # Lane 2: Detailed Attributes
    draw_box(29.0, 31.8, 19.2, 6.6, "Crop Attributes & Ecosystem Entry", [
        "System assigns Tag No. (e.g. SLG-BLG-101)",
        "Select Rice Variety planted:",
        "  Inbred (Rc 222, Rc 160) | Hybrid (Rc 488H)",
        "Select Agro-Ecosystem Classification:",
        "  Irrigated Lowland NIA | Rainfed | Upland",
        "Water Source / IA: Balagawan CIA (BCIA)",
        "Input Planting Date & Cropping Season (WS/DS)",
        "Link PCIC Crop Insurance Policy No."
    ], badge="ATTRIBUTES FORM", badge_color="#1D4ED8", border_color="#93C5FD")
    draw_elbow([(86.6, 38.5), (65.0, 38.5), (48.2, 35.1)], label="Load Attributes Form", color="#15803D")

    # Lane 4: Supabase Database Transaction
    draw_box(75.2, 31.5, 22.8, 6.9, "Supabase PostgreSQL Persistence", [
        "Execute ACID Database Transaction:",
        "1. INSERT into 'farm_parcels':",
        "   (tag_number, boundary_coords, area_ha, geom)",
        "2. INSERT/UPDATE 'rice_farm_records':",
        "   (rsbsa_no, farmer_name, tenure, variety, season)",
        "3. UPLOAD photos to Supabase S3 Storage Bucket",
        "4. BUILD GIST Spatial Index for fast spatial query",
        "5. BROADCAST Realtime WebSocket to all clients"
    ], badge="SPATIAL PERSISTENCE", badge_color="#15803D", border_color="#86EFAC")
    draw_arrow((48.2, 35.1), (75.2, 35.1), label="Commit Transaction", color="#1D4ED8")

    # Lane 3: Workstation Realtime Sync
    draw_box(53.0, 31.8, 19.2, 6.6, "MAO Central Dashboard Rollup", [
        "WebSocket receives new registered parcel",
        "Increment Silago Municipal KPI Counters:",
        "  - Total Registered Rice Farmers",
        "  - Total Hectares Georeferenced",
        "  - Irrigated vs Rainfed Distribution",
        "Queue parcel for Seasonal Crop Tracking"
    ], badge="REAL-TIME SYNC", badge_color="#4338CA", border_color="#A5B4FC")
    draw_arrow((75.2, 35.1), (72.2, 35.1), color="#4338CA")

    # =========================================================================
    # STAGE 7: SEASONAL PHENOLOGY & GROWTH MONITORING (Y: 30 to 19)
    # =========================================================================
    # Lane 2: Growth Stage Inspections
    draw_box(29.0, 20.5, 19.2, 6.8, "Crop Phenological Growth Tracking", [
        "LFT conducts bi-weekly field inspection",
        "Compute Days After Sowing (DAS = Today - PlantDate)",
        "Log Phenological Crop Growth Stage:",
        "  • DAS 1-14: Seedling / Emergence",
        "  • DAS 15-40: Tillering (Vegetative Stage)",
        "  • DAS 41-65: Panicle Initiation / Stem Elongation",
        "  • DAS 66-85: Heading & Flowering Stage",
        "  • DAS 86-105: Milk to Dough Grain Filling",
        "  • DAS 106-120: Maturity & Ripening (Harvest)"
    ], badge="CROP TRACKER", badge_color="#0284C7", border_color="#7DD3FC")
    draw_arrow((38.6, 31.8), (38.6, 27.3))

    # Lane 4: AI Decision Support & Weather
    draw_box(75.2, 20.5, 22.8, 6.8, "RiceSsistant AI & Weather Radar", [
        "Google Gemini 2.5 Flash Agronomy Core:",
        "• Automatic maturity date projection",
        "• Fertilizer application schedule (Urea/Complete)",
        "• Pest & Disease Diagnostic Knowledge Base",
        "Open-Meteo Weather API Integration:",
        "• 7-Day Rainfall & Wind Precipitation Forecast",
        "• Typhoon / Flood Early Warning Alerts"
    ], badge="GEMINI 2.5 FLASH AI", badge_color="#D97706", border_color="#FCD34D")
    draw_arrow((48.2, 23.9), (75.2, 23.9), label="Query Agronomy Engine", color="#0284C7")

    # Lane 1: Farmer Advisory Alerts
    draw_box(5.0, 20.5, 19.2, 6.8, "Farmer Advisory & SMS Notification", [
        "Farmer receives Fertilizer & Care Alerts",
        "Receives Typhoon / Flood Evacuation Warning",
        "Consults RiceSsistant via mobile web chat",
        "Prepares threshers & drying mats for harvest",
        "Coordinates with Balagawan CIA water tender"
    ], badge="ADVISORY DISPATCH", badge_color="#C2410C", border_color="#FDBA74")
    draw_arrow((29.0, 23.9), (24.2, 23.9), label="Send SMS / Notice", color="#0284C7")

    # =========================================================================
    # STAGE 8: HARVEST YIELD COMPUTATION & PEST ADVISORY (Y: 19 to 8)
    # =========================================================================
    # Lane 2: Yield Recording
    draw_box(29.0, 9.8, 19.2, 6.8, "Actual Harvest Yield Recording", [
        "Record Actual Harvest Date",
        "Record Production in 50-kg Cavans/Bags:",
        "  (e.g., 140 cavans harvested)",
        "Compute Production Volume in Metric Tons:",
        "  actualProductionVolumeMt = bags * 50 / 1000",
        "Compute Yield per Hectare (MT/ha):",
        "  yieldMtPerHa = actualProductionVolumeMt / areaHa",
        "Compute Gross Farm Income in PHP:",
        "  grossIncome = bags * 1,150.00 (PHP)"
    ], badge="HARVEST LOG", badge_color="#1D4ED8", border_color="#93C5FD")
    draw_arrow((38.6, 20.5), (38.6, 16.6))

    # Lane 4: Pest & Damage Valuation
    draw_box(75.2, 9.8, 22.8, 6.8, "Pest Damage & PCIC Claims Engine", [
        "Evaluate Crop Health Status:",
        "  - Harvest Completed (Normal)",
        "  - Damaged (Typhoon, Flood, Pest Infestation)",
        "If Damaged (Rice Blast, Stem Borer, Kuhol):",
        "  - Calculate % Crop Loss & Area Affected",
        "  - Generate PCIC Insurance Claim Dossier",
        "  - Trigger DA Calamity Assistance Report"
    ], badge="DAMAGE & PCIC", badge_color="#DC2626", border_color="#FCA5A5")
    draw_arrow((48.2, 13.2), (75.2, 13.2), label="Yield & Damage Data", color="#1D4ED8")

    # Lane 3: Admin Final Verification
    draw_box(53.0, 9.8, 19.2, 6.8, "MAO Final Administrative Review", [
        "Audit reported Cavans & MT/ha Yield",
        "Compare against Silago Barangay average",
        "Verify RSBSA compliance & photos",
        "Endorse for Official Certification",
        "Authorize Subsidies (Fertilizer/Seeds)"
    ], badge="MAO VERIFICATION", badge_color="#4338CA", border_color="#A5B4FC")
    draw_arrow((75.2, 13.2), (72.2, 13.2), color="#4338CA")

    # =========================================================================
    # STAGE 9: OFFICIAL CERTIFICATION & DA MASTERLISTS (Y: 8 to 0)
    # =========================================================================
    # Lane 3: Certificate & Official Signing
    draw_box(53.0, 1.5, 19.2, 5.2, "Issue Official Certificate of Registry", [
        "Generate Formal MAO Certificate of Rice Farm",
        "Affix Official Municipal Seal of Silago",
        "Embed Republic of the Philippines & DA Seals",
        "Signatures: Municipal Agriculturist & Mayor",
        "Assign Unique Certificate Control Number & QR"
    ], badge="LEGAL CERTIFICATION", badge_color="#4338CA", border_color="#A5B4FC")
    draw_arrow((62.6, 9.8), (62.6, 6.7))

    # Lane 4: Multi-format Masterlist Exports
    draw_box(75.2, 1.5, 22.8, 5.2, "Automated DA Masterlists & Exports", [
        "Export Multi-format Official Datasets:",
        "• PDF: Municipal Rice Farm Registry Ledgers",
        "• Excel (.xlsx): DA Regional Office VIII Submissions",
        "• CSV: Tabular Data for PhilRice & DA-RSBSA",
        "• Irrigators Association (BCIA) Directory"
    ], badge="OFFICIAL EXPORTS", badge_color="#15803D", border_color="#86EFAC")
    draw_arrow((72.2, 4.1), (75.2, 4.1), label="Export Masterlists", color="#4338CA")

    # Lane 1: Farmer Receives Certificate & Subsidies
    draw_pill(5.0, 2.2, 19.2, 3.8, "FINAL TERMINAL: Farmer Receives Certificate\nAcquires DA Subsidies & Insurance\nParcel Permanently Synchronized in GIS", "#15803D")
    draw_elbow([(53.0, 4.1), (40.0, 4.1), (24.2, 4.1)], label="Deliver Certificate", color="#15803D")

    plt.tight_layout(pad=0.8)
    plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Successfully generated 100% complete unabridged master flowchart at: {output_path}")

if __name__ == '__main__':
    out_img = 'complete_system_flowchart_unabridged.png'
    create_unabridged_master_flowchart(out_img)

    # Copy to parent Downloads folder and artifact folder
    artifact_dir = r"C:\Users\Admin\.gemini\antigravity\brain\ba0169cb-168c-413d-935a-5719f4fe7b33"
    downloads_dir = r"C:\Users\Admin\Downloads"

    for dest in [downloads_dir, artifact_dir]:
        if os.path.exists(dest):
            shutil.copy(out_img, os.path.join(dest, out_img))
            print(f"Copied {out_img} to {dest}")
