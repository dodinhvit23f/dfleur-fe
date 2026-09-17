"use client";

import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import {
  Avatar,
  Box,
  Checkbox,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  DataGrid,
  type GridColDef,
  type GridFilterInputValueProps,
  GridPagination,
  gridPageCountSelector,
  gridRowCountSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import type { MouseEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { defaultOrders } from "./mockData";
import {
  compareOrderStatus,
  formatOrderDate,
  formatOrderTimeRange,
  formatVnd,
  getStatusType,
  hasSocialLink,
  ORDER_STATUS_VALUES,
  type Order,
  type OrderStatus,
  trans,
} from "./orderUtils";
import { StatusChangeMenu } from "./StatusChangeMenu";
import { StatusChip } from "./StatusChip";

export interface OrdersTableProps {
  orders?: Order[];
}

function StatusFilterInput({ item, applyValue }: GridFilterInputValueProps) {
  const value: OrderStatus[] = item.value ?? [];

  return (
    <FormControl variant="standard" sx={{ minWidth: 180 }}>
      <InputLabel>Trạng thái</InputLabel>
      <Select
        multiple
        value={value}
        onChange={(event) =>
          applyValue({ ...item, value: event.target.value as OrderStatus[] })
        }
        renderValue={(selected) =>
          (selected as OrderStatus[]).map(trans).join(", ")
        }
      >
        {ORDER_STATUS_VALUES.map((status) => (
          <MenuItem key={status} value={status}>
            <Checkbox size="small" checked={value.includes(status)} />
            <ListItemText primary={trans(status)} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function OrdersGridFooter() {
  const apiRef = useGridApiContext();
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const rowCount = useGridSelector(apiRef, gridRowCountSelector);
  const page = apiRef.current.state.pagination.paginationModel.page;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        flexWrap: "wrap",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {`Page ${Math.min(page + 1, Math.max(pageCount, 1))} of ${Math.max(pageCount, 1)} (Total ${rowCount} records)`}
      </Typography>
      <GridPagination />
    </Box>
  );
}

export function OrdersTable({ orders = defaultOrders }: OrdersTableProps) {
  const theme = useTheme();
  const { notify } = useNotification();

  const codeToIndex = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((order, index) => {
      map.set(order.orderCode, index);
    });
    return map;
  }, [orders]);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleStatusClick = useCallback(
    (event: MouseEvent<HTMLElement>, index: number) => {
      setAnchorEl(event.currentTarget);
      setActiveIndex(index);
    },
    [],
  );

  const handleStatusSelect = (newStatus: OrderStatus) => {
    notify(`Đổi trạng thái đơn hàng sang "${trans(newStatus)}" (demo)`, "info");
  };

  const activeOrder =
    activeIndex !== null && activeIndex !== -1 ? orders[activeIndex] : null;

  const columns: GridColDef<Order>[] = useMemo(
    () => [
      {
        field: "status",
        headerName: "Trạng thái",
        width: 150,
        sortComparator: (a: OrderStatus, b: OrderStatus) =>
          compareOrderStatus(a, b),
        filterOperators: [
          {
            label: "là một trong",
            value: "isAnyOf",
            getApplyFilterFn: (filterItem) => {
              if (!filterItem.value || filterItem.value.length === 0) {
                return null;
              }
              const selected = (filterItem.value as OrderStatus[]).map(
                (status) => status.toLowerCase(),
              );
              return (value: OrderStatus) =>
                selected.includes(String(value).toLowerCase());
            },
            InputComponent: StatusFilterInput,
          },
        ],
        renderCell: (params) => (
          <StatusChip
            status={getStatusType(params.row.status)}
            label={trans(params.row.status)}
            clickable
            onClick={(event) =>
              handleStatusClick(
                event,
                codeToIndex.get(params.row.orderCode) ?? -1,
              )
            }
          />
        ),
      },
      {
        field: "image",
        headerName: "Image",
        width: 64,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Avatar
            src={params.row.samplePictureLink[0]}
            variant="rounded"
            sx={{ width: 40, height: 40 }}
          >
            {params.row.customerName.charAt(0)}
          </Avatar>
        ),
      },
      { field: "orderCode", headerName: "Order Code", width: 180 },
      {
        field: "orderDescription",
        headerName: "Order Describe",
        flex: 1,
        minWidth: 200,
        valueGetter: (_value, row) => row.orderDescription ?? "—",
      },
      {
        field: "salePrice",
        headerName: "Sale Price",
        width: 130,
        valueFormatter: (value: number) => formatVnd(value),
      },
      {
        field: "deliveryDate",
        headerName: "Delivery Date",
        width: 130,
        valueGetter: (_value, row) => formatOrderDate(row.deliveryDateStart),
      },
      {
        field: "deliveryTime",
        headerName: "Delivery Time",
        width: 130,
        valueGetter: (_value, row) =>
          formatOrderTimeRange(row.deliveryDateStart, row.deliveryDateEnd),
      },
      {
        field: "deliveryAddress",
        headerName: "Delivery Address",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "receiver",
        headerName: "Receiver",
        width: 200,
        valueGetter: (_value, row) =>
          `${row.receiverName} · ${row.receiverPhone}`,
      },
      {
        field: "saleAccount",
        headerName: "Saler",
        width: 130,
      },
      {
        field: "floristAccount",
        headerName: "Florist",
        width: 130,
        valueGetter: (_value, row) => row.floristAccount ?? "—",
      },
      {
        field: "socialLink",
        headerName: "Social",
        width: 70,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const link = params.row.socialLink;
          const enabled = hasSocialLink(link);
          return (
            <Tooltip title={enabled ? "Open link" : "No link"}>
              <span>
                <IconButton
                  size="small"
                  disabled={!enabled}
                  onClick={() =>
                    window.open(link, "_blank", "noopener,noreferrer")
                  }
                >
                  <LaunchRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [codeToIndex, handleStatusClick],
  );

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.text.secondary, 0.2)}`,
        overflow: "hidden",
      }}
    >
      <DataGrid
        rows={orders}
        columns={columns}
        getRowId={(row) => row.orderCode}
        checkboxSelection
        disableRowSelectionOnClick
        density="compact"
        pageSizeOptions={[50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 50, page: 0 } },
        }}
        autoHeight
        slots={{ footer: OrdersGridFooter }}
        sx={{
          border: "none",
          "& .MuiDataGrid-columnHeaders": {
            position: "sticky",
            top: 0,
            zIndex: 1,
            bgcolor: theme.palette.background.default,
            borderBottom: `1px solid ${alpha(theme.palette.text.secondary, 0.2)}`,
          },
        }}
      />
      <StatusChangeMenu
        anchorEl={anchorEl}
        currentStatus={activeOrder?.status ?? null}
        onClose={() => setAnchorEl(null)}
        onSelect={handleStatusSelect}
      />
    </Box>
  );
}
