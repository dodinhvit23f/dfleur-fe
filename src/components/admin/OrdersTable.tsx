"use client";

import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import {
  Avatar,
  Box,
  Button,
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
  hasSamplePicture,
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
  onImageClick: (links: string[]) => void;
}

const STICKY_COLUMN_OFFSETS: Record<string, number> = {
  __check__: 0,
  status: 50,
  samplePictureLink: 200,
  orderCode: 310,
};
const LAST_STICKY_FIELD = "orderCode";

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

export function OrdersTable({
  orders = defaultOrders,
  onImageClick,
}: OrdersTableProps) {
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
        field: "samplePictureLink",
        headerName: "Sản Phẩm",
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const links = params.value as string[];
          if (!hasSamplePicture(links)) return null;
          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <Button
                size="small"
                variant="text"
                sx={{
                  p: 0,
                  minWidth: 0,
                  fontSize: "0.7rem",
                  gap: 0.5,
                  textTransform: "none",
                }}
                onClick={() => onImageClick(links)}
              >
                <Avatar
                  src={links[0]}
                  variant="rounded"
                  sx={{ width: 40, height: 40 }}
                >
                  {params.row.customerName.charAt(0)}
                </Avatar>
                {`+${links.length} ảnh`}
              </Button>
            </Box>
          );
        },
      },
      { field: "orderCode", headerName: "Mã Đơn", width: 180 },
      {
        field: "orderDescription",
        headerName: "Thông Tin Đơn",
        flex: 1.4,
        minWidth: 260,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const lines: { label: string; value?: string }[] = [
            { label: "Order", value: params.row.orderDescription },
            { label: "Remark", value: params.row.customerRemark },
            { label: "Banner", value: params.row.bannerContent },
          ];
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                width: "100%",
                py: 1,
              }}
            >
              {lines.map(({ label, value }) => (
                <Box key={label} sx={{ display: "flex", gap: 0.5 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ flexShrink: 0 }}
                  >
                    {label}:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {value ?? "—"}
                  </Typography>
                </Box>
              ))}
            </Box>
          );
        },
      },
      {
        field: "salePrice",
        headerName: "Giá Niêm Yết",
        width: 130,
        valueFormatter: (value: number) => formatVnd(value),
      },
      {
        field: "deliveryDate",
        headerName: "Ngày Giao",
        width: 130,
        valueGetter: (_value, row) => formatOrderDate(row.deliveryDateStart),
      },
      {
        field: "deliveryTime",
        headerName: "Giờ Giao",
        width: 130,
        valueGetter: (_value, row) =>
          formatOrderTimeRange(row.deliveryDateStart, row.deliveryDateEnd),
      },
      {
        field: "deliveryAddress",
        headerName: "Địa Chỉ Giao",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "receiver",
        headerName: "Người Nhận",
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
        headerName: "Thợ Hoa",
        width: 130,
        valueGetter: (_value, row) => row.floristAccount ?? "—",
      },
      {
        field: "socialLink",
        headerName: "Mạng Xã Hội",
        width: 90,
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
    [codeToIndex, handleStatusClick, onImageClick],
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
        columnHeaderHeight={72}
        getRowHeight={() => "auto"}
        getEstimatedRowHeight={() => 80}
        pageSizeOptions={[50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 50, page: 0 } },
        }}
        autoHeight
        disableVirtualization
        slots={{ footer: OrdersGridFooter }}
        sx={{
          border: "none",
          "& .MuiDataGrid-columnHeaders": {
            position: "sticky",
            top: 0,
            zIndex: 1,
            bgcolor: theme.palette.background.default,
            borderBottom: `1px solid ${alpha(theme.palette.text.secondary, 0.2)}`,
            boxShadow: `0 4px 6px -2px ${alpha(theme.palette.text.primary, 0.08)}`,
          },
          "& .MuiDataGrid-columnHeaderTitleContainer": {
            whiteSpace: "normal",
            overflow: "visible",
          },
          "& .MuiDataGrid-columnHeaderTitleContainerContent": {
            minWidth: 0,
            overflow: "visible",
            whiteSpace: "normal",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            whiteSpace: "normal",
            overflow: "visible",
            textOverflow: "unset",
            lineHeight: 1.3,
            wordBreak: "break-word",
          },
          ...Object.fromEntries(
            Object.entries(STICKY_COLUMN_OFFSETS).flatMap(([field, left]) => {
              const isLast = field === LAST_STICKY_FIELD;
              const edgeShadow = isLast
                ? {
                    boxShadow: `4px 0 8px ${alpha(theme.palette.text.primary, 0.08)}`,
                  }
                : {};
              return [
                [
                  `& .MuiDataGrid-cell[data-field="${field}"]`,
                  {
                    position: "sticky",
                    left,
                    zIndex: 2,
                    bgcolor: theme.palette.background.paper,
                    ...edgeShadow,
                  },
                ],
                [
                  `& .MuiDataGrid-columnHeader[data-field="${field}"]`,
                  {
                    position: "sticky",
                    left,
                    zIndex: 3,
                    bgcolor: theme.palette.background.default,
                    ...edgeShadow,
                  },
                ],
                [
                  `& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="${field}"]`,
                  {
                    // action.hover/selected are semi-transparent; layering them as a
                    // gradient on top of the opaque bgcolor (rather than replacing it)
                    // keeps the sticky cell fully opaque so scrolled content underneath
                    // can't bleed through on hover/selection.
                    backgroundImage: `linear-gradient(${theme.palette.action.hover}, ${theme.palette.action.hover})`,
                  },
                ],
                [
                  `& .MuiDataGrid-row.Mui-selected .MuiDataGrid-cell[data-field="${field}"]`,
                  {
                    backgroundImage: `linear-gradient(${theme.palette.action.selected}, ${theme.palette.action.selected})`,
                  },
                ],
              ];
            }),
          ),
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
