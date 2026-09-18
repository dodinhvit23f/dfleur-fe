"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {
  emptyOrdersFilterState,
  hasActiveOrdersFilters,
  ORDER_STATUS_META,
  ORDER_STATUS_OPTIONS,
  type OrdersFilterState,
  type OrderStatus,
} from "./orderUtils";

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
  const handleStatusesChange = (event: SelectChangeEvent<OrderStatus[]>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      statuses:
          typeof value === "string" ? (value.split(",") as OrderStatus[]) : value,
    });
  };

  const handleSalersChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      salers: typeof value === "string" ? value.split(",") : value,
    });
  };

  const handleFloristsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
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

  return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Paper elevation={1} sx={{p: {xs: 2, md: 3}}}>
          <Stack spacing={2}>
            <Stack
                direction={{xs: "column", lg: "row"}}
                spacing={2}
                sx={{alignItems: {lg: "center"}}}
            >
              <TextField
                  size="small"
                  placeholder="Search order, customer, phone…"
                  value={filters.search}
                  onChange={(event) =>
                      onFiltersChange({...filters, search: event.target.value})
                  }
                  sx={{minWidth: {xs: "100%", lg: 240}}}
                  slotProps={{
                    input: {
                      startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon fontSize="small"/>
                          </InputAdornment>
                      ),
                    },
                  }}
              />

              <DatePicker
                  label="Delivery Start Date"
                  value={filters.deliveryStart}
                  onChange={(date) =>
                      onFiltersChange({...filters, deliveryStart: date})
                  }
                  slotProps={{textField: {size: "small"}}}
                  sx={{minWidth: {xs: "100%", lg: 200}}}
              />
              <DatePicker
                  label="Delivery End Date"
                  value={filters.deliveryEnd}
                  onChange={(date) =>
                      onFiltersChange({...filters, deliveryEnd: date})
                  }
                  slotProps={{textField: {size: "small"}}}
                  sx={{minWidth: {xs: "100%", lg: 200}}}
              />

              <Select
                  multiple
                  displayEmpty
                  size="small"
                  value={filters.statuses}
                  onChange={handleStatusesChange}
                  renderValue={(selected) =>
                      selected.length === 0 ? "Status" : `Status (${selected.length})`
                  }
                  sx={{minWidth: {xs: "100%", lg: 150}}}
              >
                {ORDER_STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status}>
                      <Checkbox
                          size="small"
                          checked={filters.statuses.includes(status)}
                      />
                      <ListItemText primary={ORDER_STATUS_META[status].label}/>
                    </MenuItem>
                ))}
              </Select>

              <Select
                  multiple
                  displayEmpty
                  size="small"
                  value={filters.salers}
                  onChange={handleSalersChange}
                  renderValue={(selected) =>
                      selected.length === 0 ? "Sales" : `Sales (${selected.length})`
                  }
                  sx={{minWidth: {xs: "100%", lg: 150}}}
              >
                {saleOptions.map((saler) => (
                    <MenuItem key={saler} value={saler}>
                      <Checkbox
                          size="small"
                          checked={filters.salers.includes(saler)}
                      />
                      <ListItemText primary={saler}/>
                    </MenuItem>
                ))}
              </Select>

              <Select
                  multiple
                  displayEmpty
                  size="small"
                  value={filters.florists}
                  onChange={handleFloristsChange}
                  renderValue={(selected) =>
                      selected.length === 0
                          ? "Florist"
                          : `Florist (${selected.length})`
                  }
                  sx={{minWidth: {xs: "100%", lg: 150}}}
              >
                {floristOptions.map((florist) => (
                    <MenuItem key={florist} value={florist}>
                      <Checkbox
                          size="small"
                          checked={filters.florists.includes(florist)}
                      />
                      <ListItemText primary={florist}/>
                    </MenuItem>
                ))}
              </Select>

              <Box
                  sx={{
                    ml: {lg: "auto"},
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                  }}
              >
                {onNewOrder && (
                    <Tooltip title="New Order">
                      <IconButton color="primary" onClick={onNewOrder}>
                        <AddRoundedIcon/>
                      </IconButton>
                    </Tooltip>
                )}
                <Tooltip title="Export to Excel">
                  <IconButton color="primary" onClick={onExport}>
                    <FileDownloadRoundedIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print Order">
                  <IconButton color="primary" onClick={onPrint}>
                    <PrintRoundedIcon/>
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>

            {activeFiltersPresent && (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{flexWrap: "wrap", rowGap: 1}}
                >
                  {filters.search.trim() !== "" && (
                      <Chip
                          size="small"
                          label={`Search: ${filters.search}`}
                          onDelete={() => onFiltersChange({...filters, search: ""})}
                      />
                  )}
                  {filters.deliveryStart && (
                      <Chip
                          size="small"
                          label={`From: ${filters.deliveryStart.toLocaleDateString()}`}
                          onDelete={() =>
                              onFiltersChange({...filters, deliveryStart: null})
                          }
                      />
                  )}
                  {filters.deliveryEnd && (
                      <Chip
                          size="small"
                          label={`To: ${filters.deliveryEnd.toLocaleDateString()}`}
                          onDelete={() =>
                              onFiltersChange({...filters, deliveryEnd: null})
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
