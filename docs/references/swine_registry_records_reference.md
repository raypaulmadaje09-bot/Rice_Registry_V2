# Reference Architecture & Feature Specification: LGU Swine Registry Records

**Reference Source:** `https://lguhinunanganswineregistry.vercel.app/records`  
**Local Codebase Reference:** `C:\Users\Admin\Downloads\da-hinunangan-swine-registry\src\components\records\PigsRecords.tsx`  
**Target Integration:** Silago Municipal Agriculture Office (MAO) Rice Farm Registry and Georeferencing System (`DatabaseView.tsx`)

---

## 1. Overview & System Purpose

The LGU Registry Records system is designed as a high-density, authoritative municipal database and reporting portal for agricultural and livestock monitoring. It satisfies local government documentation requirements, field technician workflows, and national reporting standards (e.g., DA-RSBSA and LGU MAO mandates).

---

## 2. Core Functional Features

### 2.1. Top Header & Document Export Suite
1. **Interactive Count Header**:
   - Header with title and live count pill (e.g., `X Heads` or `X Parcels / Farmers`).
   - Descriptive subtitle specifying municipal jurisdiction and supported export standards.
2. **Export to Microsoft Excel (.CSV)**:
   - Prepends UTF-8 Byte Order Mark (`\uFEFF`) to prevent character encoding issues in Excel on Windows.
   - Outputs comprehensive columns (RSBSA ID, Farmer Name, Barangay, Area/Weight, Variety/Breed, Coordinates, Status, Dates).
   - Generates filename with ISO date timestamp: `DA_<Municipality>_Records_YYYY-MM-DD.csv`.
3. **Export to Microsoft Word (.DOC)**:
   - Generates a native HTML document formatted with Microsoft Office XML namespaces (`xmlns:o='urn:schemas-microsoft-com:office:office'`, `xmlns:w='urn:schemas-microsoft-com:office:word'`).
   - Official LGU header: Republic of the Philippines, Province of Southern Leyte, Municipality, Department of Agriculture.
   - Formatted table with green header styling (`#15803d`), cell borders, and currency/unit formatting.
   - Dual-signatory block: "Prepared by: Agricultural Extension Worker / LFT Officer" and "Attested & Approved by: Municipal Agricultural Officer (MAO)".
4. **Printable Summary Report Modal (PDF format)**:
   - Dedicated floating modal with dark toolbar: "Print Now" (`window.print()`) and Close.
   - Dual-seal header (DA logo and Municipal seal).
   - 4 Metric Summary Cards: Total Listed Records, Total Physical Area/Quantity, Active Season/Category, Georeferenced/Verified Percentage.
   - Formal tabular listing with numbering, identifiers, locations, specifications, and statuses.
   - Official signatories footer with line rules and official municipal titles.
5. **Primary "+ Register New" Action Button**:
   - Prominent green button triggering the registration modal.

---

### 2.2. Search, Filter, and Sorting Bar
1. **Unified Multi-field Search**:
   - Case-insensitive search across ID/tag, farmer name, barangay, variety/breed, and RSBSA number.
2. **Barangay Jurisdiction Scoping**:
   - Dropdown showing "All Barangays (Count)" and all individual barangays.
   - Role-based scoping: Local Farmer Technicians (LFT) / Focal Persons are locked or restricted to their assigned barangay(s), while Central Admins can view all.
3. **Multi-field Sorting with Ascending/Descending Toggle**:
   - Sort fields: Registration Date, Farm Area / Weight, Identifier / Tag Number, Farmer Name.
   - Direction toggle button (`ArrowUpDown`) flipping `asc` and `desc` with immediate table reordering.
4. **Archived Records Separation**:
   - Soft-delete / Archive pattern: active records vs archived records.
   - Checkbox toggle: "Show Archived Records" allowing inspection and restoration without permanently dropping records from the database.
5. **Dynamic Counter**:
   - "Showing **X** of **Y** total records".

---

### 2.3. Authoritative Table Design & Row Actions
1. **Visual Row Presentation**:
   - Thumbnail preview (avatar or field photo) + Identifier + Registration Date.
   - Farmer Name + Barangay + Purok + Contact Number.
   - Agricultural Classification (Rice Variety, Seed Type, Agro-Ecosystem).
   - Physical Metric: Farm Area (ha), Estimated Yield (MT), Production Volume.
   - Georeferenced Status Pill: GPS Mapped, Polygon Mapped, or Unmapped.
   - Status Badge: Active, Standing Crop, Harvest Completed, Live Synced.
2. **Row Action Suite**:
   - **Certificate Generation (`FileText`)**: Instant trigger opening the official Georeference Certificate modal for that specific record.
   - **Locate on GIS Map (`MapPin`)**: Centers and highlights the parcel on the interactive Leaflet GIS map.
   - **Dossier & History (`History`)**: Opens detailed historical log and seasonal production modal.
   - **Inline / Modal Edit (`Edit`)**: Enables updating records directly.
   - **Archive / Restore (`Archive` / `ArchiveRestore`)**: Toggles record archive status.
   - **Permanent Deletion (`Trash2`)**: Restricted to Central Admin with confirmation prompt.

---

## 3. Data Model Alignment (Swine -> Rice Registry)

| Swine Registry Field (`PigsRecords.tsx`) | Rice Registry Equivalent (`FarmParcel`) | Description |
| :--- | :--- | :--- |
| `earTagNo` | `tagNumber` / `swineNameOrId` | Official Tag or RSBSA Reference Number |
| `farmerName` | `raiserName` / `farmerFamilyName`, `farmerGivenName` | Registered Farmer / Land Tiller |
| `barangay` | `barangay` | One of the 15 Silago Barangays |
| `breed` / `swineType` | `breed` / `seedType` (e.g. NSIC Rc 222, Inbred/Hybrid) | Certified Rice Variety and Seed Category |
| `weightKg` | `weightKg` / `areaHa` | Farm Area in Hectares (ha) |
| `biosecurity` (Rating / 10) | `biosecurityScore` / Georeferenced | GPS Coordinates & Boundary Mapping Verification |
| `status` (growing / readyToSell / sold) | `healthStatus` / `productionStatus` | Standing Crop, Harvest Completed, Fallow |
| `isArchived` | `isArchived` | Soft archive flag |
| `registeredAt` | `registrationDate` / `created_at` | Date of registration in database |

---

## 4. Implementation Checklist for Rice Registry (`DatabaseView.tsx`)

- [x] Integrate Word (.DOC) Export with official Silago Municipal Agriculture header and formal signatories.
- [x] Integrate Excel (.CSV) Export with UTF-8 BOM encoding for seamless Microsoft Excel compatibility.
- [x] Implement Official Printable PDF Summary Report Modal with 4 summary metric cards, official seals, and MAO signatories.
- [x] Implement multi-criteria sort dropdown (Date, Area, RSBSA No, Farmer Name, Barangay) with Asc/Desc toggle button.
- [x] Implement Active vs. Archived records toggle (`isArchived`).
- [x] Add Direct Certificate Generation button (`FileText`) to each table row.
- [x] Add Archive/Restore button to each table row.
- [x] Preserve all existing advanced Rice Registry features (Inline spreadsheet editing, Polygon GPS mapping, Seasonal Production modal, Realtime Supabase live sync).
