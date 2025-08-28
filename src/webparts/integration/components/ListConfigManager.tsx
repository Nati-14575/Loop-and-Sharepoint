import * as React from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Button,
  TextField,
  Checkbox,
  MenuItem,
  Divider,
  Box,
  Typography,
  Stack,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { UserListConfig } from "../utils/dynamicConfig";
import { SharePointService } from "../utils/SharePointService";
import { getSpfxCtx } from "../utils/spfxCtx";

type Props = {
  open: boolean;
  configs: UserListConfig[];
  onSave: (newConfigs: UserListConfig[]) => void;
  onCancel: () => void;
};

type Fields = {
  internalName: string;
  displayName: string;
  fieldType: number;
};

export default function ListConfigManagerSidebar({
  open,
  configs,
  onSave,
  onCancel,
}: Props) {
  const [localConfigs, setLocalConfigs] = React.useState<UserListConfig[]>(
    configs.map((cfg) => {
      const hasAcceptance = (cfg.systemColumns || []).some(
        (c) => c.key === "acceptanceCriteria"
      );

      return hasAcceptance
        ? cfg
        : {
            ...cfg,
            systemColumns: [
              ...(cfg.systemColumns || []),
              { key: "acceptanceCriteria", displayName: "Acceptance Criteria" },
            ],
          };
    })
  );

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [availableFields, setAvailableFields] = React.useState<Fields[]>([]);
  const [newKey, setNewKey] = React.useState<string>("");
  const [newLabel, setNewLabel] = React.useState<string>("");
  const [importOpen, setImportOpen] = React.useState(false);
  const [importText, setImportText] = React.useState("");

  const selectedCfg = localConfigs[selectedIndex];

  const handleUpdate = (patch: Partial<UserListConfig>) => {
    const updated = [...localConfigs];
    updated[selectedIndex] = { ...updated[selectedIndex], ...patch };
    setLocalConfigs(updated);
  };

  const handleMappingChange = (
    field: keyof UserListConfig["mapping"],
    value: string[]
  ) => {
    const updated = [...localConfigs];
    const selectedValues: string[] = [];

    for (let i = 0; i < value.length; i++) {
      const v = value[i];
      const col = availableFields.filter((f) => f.internalName === v)?.[0];

      if (col?.fieldType === 20) {
        // Person/Group field → store both /Title and /Email
        selectedValues.push(`${v}/EMail`);
      } else {
        selectedValues.push(v);
      }
    }

    updated[selectedIndex].mapping[field] = selectedValues;
    setLocalConfigs(updated);
  };

  const spService = new SharePointService(getSpfxCtx());

  async function fetchListColumns(
    siteUrl: string,
    listTitle: string
  ): Promise<Fields[]> {
    const resp = await spService.fetchSpColumns(siteUrl, listTitle);

    const updatedResp = resp?.value?.map((r: any) => {
      return {
        internalName: r.InternalName,
        displayName: r.Title,
        fieldType: r.FieldTypeKind,
      };
    });
    return updatedResp;
  }

  const handleFetchFields = async () => {
    if (!selectedCfg.siteUrl || !selectedCfg.listTitle) return;
    const cols = await fetchListColumns(
      selectedCfg.siteUrl,
      selectedCfg.listTitle
    );
    setAvailableFields(cols);
  };
  console.log(selectedCfg);
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onCancel}
      sx={{ "& .MuiDrawer-paper": { width: 720 } }}
    >
      <Box sx={{ display: "flex", height: "100%" }}>
        {/* Sidebar */}
        <Box sx={{ width: 200, borderRight: "1px solid #ddd" }}>
          <List>
            {localConfigs.map((cfg, i) => (
              <ListItemButton
                key={i}
                selected={i === selectedIndex}
                onClick={() => setSelectedIndex(i)}
              >
                <ListItemText primary={cfg.listTitle || `List ${i + 1}`} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <Button
            fullWidth
            onClick={() =>
              setLocalConfigs((prev) => [
                ...prev,
                {
                  listTitle: "",
                  siteUrl: "",
                  tabName: "",
                  mapping: {},
                  extraFields: [],
                  systemColumns: [
                    {
                      key: "acceptanceCriteria",
                      displayName: "Acceptance Criteria",
                    },
                  ],
                },
              ])
            }
          >
            + Add List
          </Button>
        </Box>

        {/* Editor */}
        <Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
          {selectedCfg ? (
            <Stack spacing={2}>
              <Typography variant="h6">Edit Configuration</Typography>

              <TextField
                label="Site URL"
                fullWidth
                size="small"
                value={selectedCfg.siteUrl}
                onChange={(e) => handleUpdate({ siteUrl: e.target.value })}
              />

              <TextField
                label="List Title"
                fullWidth
                size="small"
                value={selectedCfg.listTitle}
                onChange={(e) => handleUpdate({ listTitle: e.target.value })}
              />

              <TextField
                label="Tab Name"
                fullWidth
                size="small"
                value={selectedCfg.tabName}
                onChange={(e) => handleUpdate({ tabName: e.target.value })}
              />
              <Typography variant="h6">System Columns</Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  label="Column Key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
                <TextField
                  size="small"
                  label="Display Name"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    const updated = [...localConfigs];
                    updated[selectedIndex] = {
                      ...selectedCfg,
                      systemColumns: [
                        ...(selectedCfg.systemColumns || []),
                        { key: newKey, displayName: newLabel },
                      ],
                    };
                    setLocalConfigs(updated);
                    setNewKey("");
                    setNewLabel("");
                  }}
                >
                  Add
                </Button>
              </Stack>

              <List dense>
                {selectedCfg.systemColumns?.map((col) => (
                  <ListItemButton
                    key={col.key}
                    onClick={() => {
                      const updated = [...localConfigs];
                      updated[selectedIndex] = {
                        ...selectedCfg,
                        systemColumns: selectedCfg.systemColumns.filter(
                          (c) => c.key !== col.key
                        ),
                      };
                      setLocalConfigs(updated);
                    }}
                  >
                    <ListItemText primary={`${col.displayName} (${col.key})`} />
                  </ListItemButton>
                ))}
              </List>

              <Button variant="outlined" onClick={handleFetchFields}>
                Fetch List Columns
              </Button>

              {availableFields?.length > 0 && (
                <>
                  <Typography variant="subtitle2">Field Mappings</Typography>
                  {selectedCfg.systemColumns.map((col) => (
                    <FormControl key={col.key} size="small" fullWidth>
                      <InputLabel>{`Map ${col.displayName}`}</InputLabel>
                      <Select
                        multiple
                        value={selectedCfg.mapping[col.key] ?? []}
                        onChange={(e) =>
                          handleMappingChange(
                            col.key,
                            e.target.value as string[]
                          )
                        }
                        input={
                          <OutlinedInput label={`Map ${col.displayName}`} />
                        }
                        renderValue={(selected) =>
                          (selected as string[]).join(", ")
                        }
                      >
                        {availableFields.map((field) => {
                          const values =
                            field.fieldType === 20
                              ? [
                                  `${field.internalName}/Title`,
                                  `${field.internalName}/EMail`,
                                ]
                              : [field.internalName];

                          return values.map((val) => (
                            <MenuItem key={val} value={val}>
                              <Checkbox
                                checked={
                                  selectedCfg.mapping[col.key]?.indexOf(val) >
                                  -1
                                }
                              />
                              <ListItemText primary={val} />
                            </MenuItem>
                          ));
                        })}
                      </Select>
                    </FormControl>
                  ))}

                  <Typography variant="subtitle2" sx={{ mt: 2 }}>
                    Extra Fields to Fetch
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      multiple
                      value={selectedCfg.extraFields || []}
                      onChange={(e) =>
                        handleUpdate({
                          extraFields: e.target.value as string[],
                        })
                      }
                      input={<OutlinedInput label="Extra Fields" />}
                      renderValue={(selected) =>
                        (selected as string[]).join(", ")
                      }
                    >
                      {availableFields.map((col) => {
                        // For user fields → store both /Title and /EMail
                        const values =
                          col.fieldType === 20
                            ? [
                                `${col.internalName}/Title`,
                                `${col.internalName}/EMail`,
                              ]
                            : [col.internalName];

                        return values.map((val) => (
                          <MenuItem key={val} value={val}>
                            <Checkbox
                              checked={
                                (selectedCfg.extraFields || [])?.indexOf(
                                  val
                                ) !== -1
                              }
                            />
                            <ListItemText primary={val} />
                          </MenuItem>
                        ));
                      })}
                    </Select>
                  </FormControl>
                </>
              )}
            </Stack>
          ) : (
            <Typography>Select a list from the sidebar to edit.</Typography>
          )}
        </Box>
      </Box>

      {/* Footer actions */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() => {
              const blob = new Blob([JSON.stringify(localConfigs, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "list-configs.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export JSON
          </Button>

          <Button variant="outlined" onClick={() => setImportOpen(true)}>
            Import JSON
          </Button>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(localConfigs)} variant="contained">
            Save
          </Button>
        </Stack>
      </Box>
      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import Config JSON</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            minRows={10}
            fullWidth
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste your JSON array of UserListConfig objects here"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              try {
                const parsed = JSON.parse(importText);
                if (Array.isArray(parsed)) {
                  setLocalConfigs(parsed);
                  setImportOpen(false);
                  setImportText("");
                } else {
                  alert("Invalid JSON: must be an array of configs");
                }
              } catch (err) {
                alert("Failed to parse JSON: " + err);
              }
            }}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
