# Feature Mapping Catalog (Part 3)

## 8. Plugin System

| C# Module / Class | JS/TS Module / File | Feature / Functionality | Status | Notes |
|-------------------|---------------------|-------------------------|--------|-------|
| `AasxIntegrationBase/AasxPluginInterface.cs` | `shared/plugin-types.ts` | Plugin Interface Definition | ⚙️ Partial | Basic interface; Missing many methods |
| `AasxIntegrationBase/AasxPluginHelper.cs` | `server/src/plugins/plugin-loader.ts` | Plugin Loader | ⚙️ Partial | Basic loading; No dynamic loading |
| `AasxPluginDocumentShelf/Plugin.cs` | `server/src/plugins/document-shelf/` | Document Shelf Plugin | ⚙️ Partial | Basic implementation; Missing UI |
| `AasxPluginTechnicalData/Plugin.cs` | `server/src/plugins/technical-data/` | Technical Data Plugin | ⚙️ Partial | Basic implementation; Missing UI |
| `AasxPluginExportTable/Plugin.cs` | ❌ Missing | Export Table Plugin | ❌ Missing | Not implemented |
| `AasxPluginPlotting/Plugin.cs` | ❌ Missing | Plotting Plugin | ❌ Missing | Not implemented |
| `AasxPluginAdvancedTextEditor/Plugin.cs` | ❌ Missing | Advanced Text Editor Plugin | ❌ Missing | Not implemented |
| `AasxPluginKnownSubmodels/Plugin.cs` | ❌ Missing | Known Submodels Plugin | ❌ Missing | Not implemented |
| `AasxPluginProductChangeNotifications/Plugin.cs` | ❌ Missing | PCN Plugin | ❌ Missing | Not implemented |
| `AasxPluginSmdExporter/Plugin.cs` | ❌ Missing | SMD Exporter Plugin | ❌ Missing | Not implemented |
| `AasxPluginImageMap/Plugin.cs` | ❌ Missing | Image Map Plugin | ❌ Missing | Not implemented |
| `AasxPluginMtpViewer/Plugin.cs` | ❌ Missing | MTP Viewer Plugin | ❌ Missing | Not implemented |
| `AasxPluginGenericForms/Plugin.cs` | ❌ Missing | Generic Forms Plugin | ❌ Missing | Not implemented |
| `AasxPluginContactInformation/Plugin.cs` | ❌ Missing | Contact Information Plugin | ❌ Missing | Not implemented |
| `AasxPluginDigitalNameplate/Plugin.cs` | ❌ Missing | Digital Nameplate Plugin | ❌ Missing | Not implemented |
| `AasxPluginAssetInterfaceDesc/Plugin.cs` | ❌ Missing | Asset Interface Desc Plugin | ❌ Missing | Not implemented |
| `AasxPluginBomStructure/Plugin.cs` | ❌ Missing | BOM Structure Plugin | ❌ Missing | Not implemented |
| `AasxPluginWebBrowser/Plugin.cs` | ❌ Missing | Web Browser Plugin | ❌ Missing | Not implemented |
| `AasxPluginUaNetClient/Plugin.cs` | ❌ Missing | OPC UA Client Plugin | ❌ Missing | Not implemented |
| `AasxPluginUaNetServer/Plugin.cs` | ❌ Missing | OPC UA Server Plugin | ❌ Missing | Not implemented |

**Category Summary:** 2/20 plugins (10% parity); Partial implementations: 2  
**Confidence Score:** 0.15

---

## 9. REST API Server

| C# Module / Class | JS/TS Module / File | Feature / Functionality | Status | Notes |
|-------------------|---------------------|-------------------------|--------|-------|
| `AasxRestServerLibrary/AasxRestServer.cs` | `server/index.ts` | REST Server Core | ✅ Implemented | Express-based server |
| `AasxRestServerLibrary/AasxRestServer.cs::GetAllAssetAdministrationShells()` | `server/aasx-routes.ts::GET /shells` | Get All AAS | ✅ Implemented | Returns all shells |
| `AasxRestServerLibrary/AasxRestServer.cs::GetAssetAdministrationShellById()` | `server/aasx-routes.ts::GET /shells/:id` | Get AAS by ID | ✅ Implemented | Single shell retrieval |
| `AasxRestServerLibrary/AasxRestServer.cs::GetAllSubmodels()` | `server/aasx-routes.ts::GET /submodels` | Get All Submodels | ✅ Implemented | Returns all submodels |
| `AasxRestServerLibrary/AasxRestServer.cs::GetSubmodelById()` | `server/aasx-routes.ts::GET /submodels/:id` | Get Submodel by ID | ✅ Implemented | Single submodel retrieval |
| `AasxRestServerLibrary/AasxRestServer.cs::GetSubmodelElements()` | `server/aasx-routes.ts::GET /submodels/:id/submodel-elements` | Get Submodel Elements | ✅ Implemented | Element listing |
| `AasxRestServerLibrary/AasxRestServer.cs::GetSubmodelElementByPath()` | `server/aasx-routes.ts::GET /submodels/:id/submodel-elements/:path` | Get Element by Path | ✅ Implemented | Path-based retrieval |
| `AasxRestServerLibrary/AasxRestServer.cs::PutAssetAdministrationShell()` | ⚙️ Partial | Update AAS | ⚙️ Partial | Backend partial; No validation |
| `AasxRestServerLibrary/AasxRestServer.cs::PostAssetAdministrationShell()` | ⚙️ Partial | Create AAS | ⚙️ Partial | Backend partial |
| `AasxRestServerLibrary/AasxRestServer.cs::DeleteAssetAdministrationShell()` | ❌ Missing | Delete AAS | ❌ Missing | Not implemented |
| `AasxRestServerLibrary/AasxRestServer.cs::PutSubmodel()` | ⚙️ Partial | Update Submodel | ⚙️ Partial | Backend partial |
| `AasxRestServerLibrary/AasxRestServer.cs::PostSubmodel()` | ⚙️ Partial | Create Submodel | ⚙️ Partial | Backend partial |
| `AasxRestServerLibrary/AasxRestServer.cs::DeleteSubmodel()` | ❌ Missing | Delete Submodel | ❌ Missing | Not implemented |
| `AasxRestServerLibrary/AasxRestServer.cs::GetConceptDescriptions()` | `server/aasx-routes.ts::GET /concept-descriptions` | Get Concept Descriptions | ✅ Implemented | Returns all CDs |
| `AasxRestServerLibrary/AasxRestServer.cs::GetConceptDescriptionById()` | `server/aasx-routes.ts::GET /concept-descriptions/:id` | Get CD by ID | ✅ Implemented | Single CD retrieval |

**Category Summary:** 9/15 features (60% parity); Partial: 4  
**Confidence Score:** 0.78

---

## 10. Dictionary Integration

| C# Module / Class | JS/TS Module / File | Feature / Functionality | Status | Notes |
|-------------------|---------------------|-------------------------|--------|-------|
| `AasxDictionaryImport/Import.cs` | ❌ Missing | Dictionary Import Core | ❌ Missing | No dictionary integration |
| `AasxDictionaryImport/Eclass/EclassUtils.cs` | ❌ Missing | ECLASS Integration | ❌ Missing | Not implemented |
| `AasxDictionaryImport/Cdd/CddUtils.cs` | ❌ Missing | IEC CDD Integration | ❌ Missing | Not implemented |
| `AasxDictionaryImport/ImportDialog.xaml` | ❌ Missing | Dictionary Import UI | ❌ Missing | Not implemented |
| `AasxDictionaryImport/FetchOnlineDialog.xaml` | ❌ Missing | Online Dictionary Fetch | ❌ Missing | Not implemented |
| `AasxDictionaryImport/ElementDetailsDialog.xaml` | ❌ Missing | Element Details from Dictionary | ❌ Missing | Not implemented |
| `AasxPackageLogic/EclassUtils.cs` | ❌ Missing | ECLASS Utilities | ❌ Missing | Not implemented |
| `AasxDictionaryImport/Iec61360Utils.cs` | ❌ Missing | IEC 61360 Utilities | ❌ Missing | Not implemented |

**Category Summary:** 0/8 features (0% parity)  
**Confidence Score:** 0.00

---

## 11. Import/Export Formats

| C# Module / Class | JS/TS Module / File | Feature / Functionality | Status | Notes |
|-------------------|---------------------|-------------------------|--------|-------|
| `AasCore.Aas3_1/jsonization.cs` | `shared/aas-serialization.ts` | JSON Import/Export | ✅ Implemented | Complete JSON support |
| `AasCore.Aas3_1/xmlization.cs` | ❌ Missing | XML Import/Export | ❌ Missing | No XML support |
| `AasxAmlImExport/AmlImport.cs` | ❌ Missing | AML Import | ❌ Missing | Not implemented |
| `AasxAmlImExport/AmlExport.cs` | ❌ Missing | AML Export | ❌ Missing | Not implemented |
| `AasxBammRdfImExport/RDFimport.cs` | ❌ Missing | RDF Import | ❌ Missing | Not implemented |
| `AasxPackageLogic/CSVTools.cs` | ❌ Missing | CSV Export | ❌ Missing | Not implemented |
| `AasxPackageLogic/BMEcatTools.cs` | ❌ Missing | BMEcat Import/Export | ❌ Missing | Not implemented |
| `AasxSchemaExport/SubmodelTemplateJsonSchemaExporterV20.cs` | ❌ Missing | JSON Schema Export | ❌ Missing | Not implemented |
| `AasxFormatCst/AasxToCst.cs` | ❌ Missing | CST Format Export | ❌ Missing | Not implemented |

**Category Summary:** 1/9 features (11% parity)  
**Confidence Score:** 0.41

---

## 12. Authentication & Security

| C# Module / Class | JS/TS Module / File | Feature / Functionality | Status | Notes |
|-------------------|---------------------|-------------------------|--------|-------|
| `AasxOpenidClient/OpenIDClient.cs` | `server/auth/jwt-auth-routes.ts` | Authentication System | ⚙️ Partial | JWT-based; No OpenID Connect |
| `AasxOpenidClient/OpenIDClientInstance.cs` | ❌ Missing | OpenID Connect Client | ❌ Missing | Not implemented |
| `AasxCsharpLibrary/SecureAccess/*` | `server/auth/auth-middleware.ts` | Access Control | ⚙️ Partial | Basic middleware; No fine-grained control |
| `AasxSignature/AasxSignature.cs` | ❌ Missing | Digital Signatures | ❌ Missing | Not implemented |
| `AasxPackageExplorer/WinGdiSecurityAccessHandler.cs` | ❌ Missing | Security Access Handler | ❌ Missing | Not implemented |
| `server/auth/session-manager.ts` | N/A (New) | Session Management | ✅ Implemented | Express-session based |
| `server/auth/jwt-utils.ts` | N/A (New) | JWT Utilities | ✅ Implemented | Token generation/validation |

**Category Summary:** 2/7 features (29% parity); Partial: 2  
**Confidence Score:** 0.45

---

## 13. File Operations & Storage

| C# Module / Class | JS/TS Module / File | Feature / Functionality | Status | Notes |
|-------------------|---------------------|-------------------------|--------|-------|
| `AasxCsharpLibrary/PackageEnv/PackageEnv.cs::SaveAs()` | `server/src/services/aasx-package-manager.ts::savePackageAs()` | Save As Operation | ✅ Implemented | Save to new location |
| `AasxCsharpLibrary/PackageEnv/PackageEnv.cs::AutoSave()` | ❌ Missing | Auto-Save Feature | ❌ Missing | Not implemented |
| `AasxCsharpLibrary/PackageEnv/PackageEnv.cs::BackupCreate()` | `server/src/services/atomic-file-writer.ts` | Backup Creation | ✅ Implemented | Atomic writes with backup |
| `AasxCsharpLibrary/PackageEnv/PackageEnv.cs::TempFileManagement()` | `server/storage.ts` | Temporary File Management | ✅ Implemented | Temp file handling |
| `AasxPackageLogic/PackageCentral/PackageCentral.cs` | `server/src/services/aasx-package-manager.ts` | Package Central Management | ✅ Implemented | Multi-package management |
| `AasxPackageLogic/PackageCentral/PackageCentral.cs::RecentFiles()` | ❌ Missing | Recent Files List | ❌ Missing | Not implemented |
| `AasxPackageLogic/PackageCentral/PackageCentral.cs::FileHistory()` | ❌ Missing | File History | ❌ Missing | Not implemented |

**Category Summary:** 4/7 features (57% parity)  
**Confidence Score:** 0.82

---

