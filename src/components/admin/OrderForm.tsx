"use client";

import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { type ReactNode, useRef } from "react";
import {
  type CreateOrderPayload,
  CUSTOMER_SOURCE_OPTIONS,
  DELIVERY_FEE_OPTIONS,
  formatMoneyInput,
  formatVnd,
  toDigits,
  VAT_OPTIONS,
} from "./orderUtils";
import { SampleImagePicker } from "./SampleImagePicker";
import { useOrderForm } from "./useOrderForm";

export interface OrderFormProps {
  saleOptions: string[];
  floristOptions: string[];
  onSubmit: (order: CreateOrderPayload) => Promise<void> | void;
  onSuccess?: () => void;
}

// Fields flow into as many ~200px columns as fit (3 in a wide half-width card,
// 2 in a narrower one, 1 on phones); `gridColumn: "1 / -1"` makes a field full width.
const fieldGrid = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
} as const;

const fullWidth = { gridColumn: "1 / -1" } as const;

// Two cards side by side from `lg` up; stacked below.
const cardRow = {
  display: "grid",
  gap: 2,
  alignItems: "start",
  gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
} as const;

const cardColumn = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
} as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

interface MoneyFieldProps {
  label: string;
  value: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
  required?: boolean;
}

function MoneyField({
  label,
  value,
  onChange,
  disabled,
  required,
}: MoneyFieldProps) {
  return (
    <TextField
      size="small"
      fullWidth
      required={required}
      disabled={disabled}
      label={label}
      value={formatMoneyInput(value)}
      onChange={(event) => onChange(toDigits(event.target.value))}
      slotProps={{
        htmlInput: { inputMode: "numeric" },
        input: {
          endAdornment: <InputAdornment position="end">₫</InputAdornment>,
        },
      }}
    />
  );
}

function ReadOnlyMoney({ label, value }: { label: string; value: number }) {
  return (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={formatVnd(value)}
      slotProps={{ input: { readOnly: true } }}
    />
  );
}

export function OrderForm({
  saleOptions,
  floristOptions,
  onSubmit,
  onSuccess,
}: OrderFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  // The submit button is at the bottom of a long form; after a successful
  // create the form is blank, so bring the user back to the first field.
  const handleSuccess = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    onSuccess?.();
  };
  const { values, totals, setField, reset, submit, submitting, progress } =
    useOrderForm({ onSubmit, onSuccess: handleSuccess });

  const deliveryHint = DELIVERY_FEE_OPTIONS.find(
    (option) => option.value === values.deliveryFeeOption,
  )?.hint;

  const uploadLabel =
    progress && progress.total > 0
      ? `Đang tải ảnh ${progress.done}/${progress.total}…`
      : "Đang lưu đơn hàng…";

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        component="form"
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        sx={{
          maxWidth: 1500,
          mx: "auto",
          p: { xs: 2, md: 3 },
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box sx={cardRow}>
          <Box sx={cardColumn}>
            <Section title="Thông tin khách hàng">
              <Box sx={fieldGrid}>
                <TextField
                  size="small"
                  required
                  label="Tên người đặt"
                  value={values.customerName}
                  disabled={submitting}
                  onChange={(e) => setField("customerName", e.target.value)}
                />
                <TextField
                  size="small"
                  required
                  label="Số điện thoại người đặt"
                  value={values.customerPhone}
                  disabled={submitting}
                  onChange={(e) => setField("customerPhone", e.target.value)}
                />
                <FormControl size="small" disabled={submitting}>
                  <InputLabel>Nguồn khách hàng</InputLabel>
                  <Select
                    label="Nguồn khách hàng"
                    value={values.customerSource}
                    onChange={(e) => setField("customerSource", e.target.value)}
                  >
                    {CUSTOMER_SOURCE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Đường dẫn mạng xã hội"
                  value={values.socialLink}
                  disabled={submitting}
                  onChange={(e) => setField("socialLink", e.target.value)}
                  sx={fullWidth}
                />
              </Box>
            </Section>

            <Section title="Giao hàng">
              <Box sx={fieldGrid}>
                <TextField
                  size="small"
                  required
                  label="Địa chỉ giao"
                  value={values.deliveryAddress}
                  disabled={submitting}
                  onChange={(e) => setField("deliveryAddress", e.target.value)}
                  sx={fullWidth}
                />
                <DateTimePicker
                  ampm={false}
                  label="Thời gian sớm nhất để giao"
                  value={values.deliveryDateStart}
                  disabled={submitting}
                  onChange={(date) =>
                    date && setField("deliveryDateStart", date)
                  }
                  slotProps={{ textField: { size: "small" } }}
                />
                <DateTimePicker
                  ampm={false}
                  label="Thời gian muộn nhất phải giao"
                  value={values.deliveryDateEnd}
                  disabled={submitting}
                  onChange={(date) => date && setField("deliveryDateEnd", date)}
                  slotProps={{ textField: { size: "small" } }}
                />
                <TextField
                  size="small"
                  label="Hoàn thành trước khi giao (phút)"
                  value={values.estimateStartMinutes}
                  disabled={submitting}
                  onChange={(e) =>
                    setField("estimateStartMinutes", toDigits(e.target.value))
                  }
                  slotProps={{ htmlInput: { inputMode: "numeric" } }}
                />
                <TextField
                  size="small"
                  label="Tên người nhận"
                  value={values.receiverName}
                  disabled={submitting}
                  onChange={(e) => setField("receiverName", e.target.value)}
                />
                <TextField
                  size="small"
                  label="Số điện thoại người nhận"
                  value={values.receiverPhone}
                  disabled={submitting}
                  onChange={(e) => setField("receiverPhone", e.target.value)}
                />
              </Box>
            </Section>
          </Box>
          <Box sx={cardColumn}>
            <Section title="Nhân viên phụ trách">
              <Box sx={fieldGrid}>
                <Autocomplete
                  size="small"
                  options={saleOptions}
                  value={values.saleAccount || null}
                  disabled={submitting}
                  onChange={(_, value) => setField("saleAccount", value ?? "")}
                  renderInput={(params) => (
                    <TextField {...params} required label="Nhân viên sale" />
                  )}
                />
                <Autocomplete
                  size="small"
                  options={floristOptions}
                  value={values.floristAccount || null}
                  disabled={submitting}
                  onChange={(_, value) =>
                    setField("floristAccount", value ?? "")
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Nhân viên florist" />
                  )}
                />
              </Box>
            </Section>

            <Section title="Thông tin thanh toán">
              <Box sx={fieldGrid}>
                <MoneyField
                  required
                  label="Giá niêm yết"
                  value={values.actualPrice}
                  disabled={submitting}
                  onChange={(v) => setField("actualPrice", v)}
                />
                <MoneyField
                  label="Chiết khấu"
                  value={values.discount}
                  disabled={submitting}
                  onChange={(v) => setField("discount", v)}
                />
                <MoneyField
                  label="Phí giao hàng"
                  value={values.deliveryFee}
                  disabled={submitting}
                  onChange={(v) => setField("deliveryFee", v)}
                />
                <FormControl size="small" disabled={submitting}>
                  <InputLabel>Bên trả phí vận chuyển</InputLabel>
                  <Select
                    label="Bên trả phí vận chuyển"
                    value={values.deliveryFeeOption}
                    onChange={(e) =>
                      setField("deliveryFeeOption", Number(e.target.value))
                    }
                  >
                    {DELIVERY_FEE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>*{deliveryHint}</FormHelperText>
                </FormControl>
                <FormControl size="small" disabled={submitting}>
                  <InputLabel>Phần trăm VAT</InputLabel>
                  <Select
                    label="Phần trăm VAT"
                    value={values.vatFeeOption}
                    onChange={(e) =>
                      setField("vatFeeOption", Number(e.target.value))
                    }
                  >
                    {VAT_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option === 0 ? "Không VAT" : `${option}%`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <MoneyField
                  label="Số tiền đặt cọc"
                  value={values.deposit}
                  disabled={submitting}
                  onChange={(v) => setField("deposit", v)}
                />
                <ReadOnlyMoney label="Phí VAT" value={totals.vatFee} />
                <ReadOnlyMoney label="Giá bán ra" value={totals.salePrice} />
                <ReadOnlyMoney
                  label="Tổng giá trị đơn hàng"
                  value={totals.totalAmount}
                />
                <ReadOnlyMoney
                  label="Số tiền còn lại"
                  value={totals.remainingAmount}
                />
              </Box>
            </Section>
          </Box>
        </Box>

        <Box sx={cardRow}>
          <Section title="Ghi chú">
            <Box sx={fieldGrid}>
              <TextField
                size="small"
                multiline
                minRows={3}
                label="Mô tả đơn hàng"
                value={values.orderDescription}
                disabled={submitting}
                onChange={(e) => setField("orderDescription", e.target.value)}
              />
              <TextField
                size="small"
                multiline
                minRows={3}
                label="Ghi chú của khách"
                value={values.customerRemark}
                disabled={submitting}
                onChange={(e) => setField("customerRemark", e.target.value)}
              />
              <TextField
                size="small"
                label="Nội dung banner"
                value={values.bannerContent}
                disabled={submitting}
                onChange={(e) => setField("bannerContent", e.target.value)}
                sx={fullWidth}
              />
            </Box>
          </Section>

          <Section title="Ảnh mẫu">
            <SampleImagePicker
              files={values.images}
              disabled={submitting}
              onChange={(files) => setField("images", files)}
            />
          </Section>
        </Box>

        {submitting && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {uploadLabel}
            </Typography>
            <LinearProgress
              variant={
                progress && progress.total > 0 ? "determinate" : "indeterminate"
              }
              value={
                progress && progress.total > 0
                  ? (progress.done / progress.total) * 100
                  : undefined
              }
            />
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Button variant="outlined" disabled={submitting} onClick={reset}>
            Đặt lại
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            Tạo đơn hàng
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
