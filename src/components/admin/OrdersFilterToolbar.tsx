"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Popover,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useEffect, useState } from "react";
import {
  areOrdersFiltersEqual,
  emptyOrdersFilterState,
  hasActiveOrdersFilters,
  ORDER_STATUS_META,
  ORDER_STATUS_OPTIONS,
  type OrderStatus,
  type OrdersFilterState,
} from "./orderUtils";

const CONTROL_HEIGHT = 40;

const iconButtonSx = {
  width: CONTROL_HEIGHT,
  height: CONTROL_HEIGHT,
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
} as const;

const selectMenuProps = {
  slotProps: { paper: { sx: { maxHeight: 320 } } },
} as const;

export interface OrdersFilterToolbarProps {
  saleOptions: string[];
  floristOptions: string[];
  filters: OrdersFilterState;
  onFiltersChange: (next: OrdersFilterState) => void;
  onExport: () => void;
  onPrint: () => void;
  onNewOrder?: () => void;
}

export function OrdersFilterToolbar({
  saleOptions,
  floristOptions,
  filters,
  onFiltersChange,
  onExport,
  onPrint,
  onNewOrder,
}: OrdersFilterToolbarProps) {
  // Edits are staged in `draft`; only "Áp dụng" (or Enter in the search box)
  // hands them to `onFiltersChange`, so the server isn't queried per keystroke
  // or per checkbox. The chips below show and edit the applied `filters`.
  const [draft, setDraft] = useState(filters);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Pick up changes made outside the form (chip delete, "Clear All").
  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const dirty = !areOrdersFiltersEqual(draft, filters);
  const searchDirty = draft.search.trim() !== filters.search.trim();
  const applyDraft = () => {
    if (dirty) onFiltersChange(draft);
  };

  const applyFromPopover = () => {
    applyDraft();
    setAnchorEl(null);
  };

  // Closing the popover without applying drops its un-applied picks; the typed
  // search text stays.
  const dismissPopover = () => {
    setAnchorEl(null);
    setDraft((current) => ({ ...filters, search: current.search }));
  };

  const clearDraftFilters = () => {
    setDraft((current) => ({
      ...emptyOrdersFilterState,
      search: current.search,
    }));
  };

  const handleStatusesChange = (event: SelectChangeEvent<OrderStatus[]>) => {
    const value = event.target.value;
    setDraft({
      ...draft,
      statuses:
        typeof value === "string" ? (value.split(",") as OrderStatus[]) : value,
    });
  };

  const handleSalersChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setDraft({
      ...draft,
      salers: typeof value === "string" ? value.split(",") : value,
    });
  };

  const handleFloristsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setDraft({
      ...draft,
      florists: typeof value === "string" ? value.split(",") : value,
    });
  };

  const removeStatus = (status: OrderStatus) => {
    onFiltersChange({
      ...filters,
      statuses: filters.statuses.filter((s) => s !== status),
    });
  };

  const removeSaler = (saler: string) => {
    onFiltersChange({
      ...filters,
      salers: filters.salers.filter((s) => s !== saler),
    });
  };

  const removeFlorist = (florist: string) => {
    onFiltersChange({
      ...filters,
      florists: filters.florists.filter((f) => f !== florist),
    });
  };

  const activeFiltersPresent = hasActiveOrdersFilters(filters);
  // Applied filter groups (search has its own box, so it isn't counted here).
  const appliedGroups = [
    filters.statuses.length > 0,
    filters.salers.length > 0,
    filters.florists.length > 0,
    filters.deliveryStart !== null,
    filters.deliveryEnd !== null,
  ].filter(Boolean).length;
  const popoverOpen = anchorEl !== null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        <Stack spacing={1.5}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <TextField
              size="small"
              placeholder="Tìm theo đơn, tên khách, điện thoại"
              value={draft.search}
              onChange={(event) =>
                setDraft({ ...draft, search: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") applyDraft();
              }}
              sx={{
                flex: "1 1 260px",
                minWidth: 0,
                maxWidth: 520,
                "& .MuiOutlinedInput-root": { height: CONTROL_HEIGHT },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchDirty ? (
                    <InputAdornment position="end">
                      <Tooltip title="Áp dụng (Enter)">
                        <IconButton
                          size="small"
                          edge="end"
                          aria-label="Áp dụng tìm kiếm"
                          onClick={applyDraft}
                        >
                          <ArrowForwardRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />

            <Button
              variant="outlined"
              size="small"
              color={appliedGroups > 0 ? "primary" : "inherit"}
              startIcon={<TuneRoundedIcon />}
              aria-haspopup="dialog"
              aria-expanded={popoverOpen}
              onClick={(event) => setAnchorEl(event.currentTarget)}
              sx={{ height: CONTROL_HEIGHT, flexShrink: 0, px: 2 }}
            >
              {appliedGroups > 0 ? `Bộ lọc (${appliedGroups})` : "Bộ lọc"}
            </Button>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexShrink: 0,
                ml: "auto",
              }}
            >
              <Divider orientation="vertical" flexItem sx={{ mr: 0.5 }} />
              {onNewOrder && (
                <Tooltip title="New Order">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={onNewOrder}
                    sx={iconButtonSx}
                  >
                    <AddRoundedIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Export to Excel">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={onExport}
                  sx={iconButtonSx}
                >
                  <FileDownloadRoundedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Print Order">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={onPrint}
                  sx={iconButtonSx}
                >
                  <PrintRoundedIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Popover
            open={popoverOpen}
            anchorEl={anchorEl}
            onClose={dismissPopover}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            slotProps={{
              paper: {
                sx: { width: 400, maxWidth: "calc(100vw - 32px)", p: 2, mt: 1 },
              },
            }}
          >
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="orders-filter-status-label">Status</InputLabel>
                <Select
                  multiple
                  labelId="orders-filter-status-label"
                  label="Status"
                  value={draft.statuses}
                  onChange={handleStatusesChange}
                  renderValue={(selected) =>
                    selected
                      .map((status) => ORDER_STATUS_META[status].label)
                      .join(", ")
                  }
                  MenuProps={selectMenuProps}
                >
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status}>
                      <Checkbox
                        size="small"
                        checked={draft.statuses.includes(status)}
                      />
                      <ListItemText primary={ORDER_STATUS_META[status].label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="orders-filter-sales-label">Sales</InputLabel>
                <Select
                  multiple
                  labelId="orders-filter-sales-label"
                  label="Sales"
                  value={draft.salers}
                  onChange={handleSalersChange}
                  renderValue={(selected) => selected.join(", ")}
                  MenuProps={selectMenuProps}
                >
                  {saleOptions.map((saler) => (
                    <MenuItem key={saler} value={saler}>
                      <Checkbox
                        size="small"
                        checked={draft.salers.includes(saler)}
                      />
                      <ListItemText primary={saler} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="orders-filter-florist-label">
                  Florist
                </InputLabel>
                <Select
                  multiple
                  labelId="orders-filter-florist-label"
                  label="Florist"
                  value={draft.florists}
                  onChange={handleFloristsChange}
                  renderValue={(selected) => selected.join(", ")}
                  MenuProps={selectMenuProps}
                >
                  {floristOptions.map((florist) => (
                    <MenuItem key={florist} value={florist}>
                      <Checkbox
                        size="small"
                        checked={draft.florists.includes(florist)}
                      />
                      <ListItemText primary={florist} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction="row" spacing={1.5}>
                <DatePicker
                  label="Bắt Đầu Giao"
                  value={draft.deliveryStart}
                  onChange={(date) =>
                    setDraft({ ...draft, deliveryStart: date })
                  }
                  slotProps={{ textField: { size: "small" } }}
                  sx={{ flex: 1, minWidth: 0 }}
                />
                <DatePicker
                  label="Kết Thúc Giao"
                  value={draft.deliveryEnd}
                  onChange={(date) => setDraft({ ...draft, deliveryEnd: date })}
                  slotProps={{ textField: { size: "small" } }}
                  sx={{ flex: 1, minWidth: 0 }}
                />
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                sx={{ justifyContent: "flex-end" }}
              >
                <Button
                  size="small"
                  color="inherit"
                  onClick={clearDraftFilters}
                >
                  Xóa
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={applyFromPopover}
                  disabled={!dirty}
                >
                  Áp dụng
                </Button>
              </Stack>
            </Stack>
          </Popover>

          {activeFiltersPresent && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: "wrap",
                rowGap: 1,
                pt: 1.5,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              {filters.search.trim() !== "" && (
                <Chip
                  size="small"
                  label={`Search: ${filters.search}`}
                  onDelete={() => onFiltersChange({ ...filters, search: "" })}
                />
              )}
              {filters.deliveryStart && (
                <Chip
                  size="small"
                  label={`From: ${filters.deliveryStart.toLocaleDateString()}`}
                  onDelete={() =>
                    onFiltersChange({ ...filters, deliveryStart: null })
                  }
                />
              )}
              {filters.deliveryEnd && (
                <Chip
                  size="small"
                  label={`To: ${filters.deliveryEnd.toLocaleDateString()}`}
                  onDelete={() =>
                    onFiltersChange({ ...filters, deliveryEnd: null })
                  }
                />
              )}
              {filters.statuses.map((status) => (
                <Chip
                  key={status}
                  size="small"
                  label={`Status: ${ORDER_STATUS_META[status].label}`}
                  onDelete={() => removeStatus(status)}
                />
              ))}
              {filters.salers.map((saler) => (
                <Chip
                  key={saler}
                  size="small"
                  label={`Sales: ${saler}`}
                  onDelete={() => removeSaler(saler)}
                />
              ))}
              {filters.florists.map((florist) => (
                <Chip
                  key={florist}
                  size="small"
                  label={`Florist: ${florist}`}
                  onDelete={() => removeFlorist(florist)}
                />
              ))}
              <Chip
                size="small"
                variant="outlined"
                label="Clear All"
                onClick={() => onFiltersChange(emptyOrdersFilterState)}
              />
            </Stack>
          )}
        </Stack>
      </Paper>
    </LocalizationProvider>
  );
}
