"use client";

import {
  Alert,
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
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import {
  CUSTOMER_SOURCE_OPTIONS,
  DELIVERY_FEE_OPTIONS,
  formatMoneyInput,
  ORDER_FIELD_LABELS,
  type OrderFormValues,
  toDigits,
  VAT_OPTIONS,
} from "./orderForm";
import { type CreateOrderPayload, formatVnd } from "./orderUtils";
import { SampleImagePicker } from "./SampleImagePicker";
import { useOrderForm } from "./useOrderForm";

export interface OrderFormProps {
  saleOptions: string[];
  floristOptions: string[];
  /** Starting values; a replaced object rebases the draft (see `useOrderForm`). */
  initialValues: OrderFormValues;
  onSubmit: (order: CreateOrderPayload) => Promise<void> | void;
  successMessage: string;
  submitLabel: string;
  resetLabel: string;
  /** Keep the save button disabled until something changed (editing). */
  requireChange?: boolean;
  resetOnSuccess?: () => OrderFormValues;
  onSuccess?: () => void;
  onStale?: () => Promise<unknown>;
  onDirtyChange?: (dirty: boolean) => void;
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
  error?: string;
}

function MoneyField({
  label,
  value,
  onChange,
  disabled,
  required,
  error,
}: MoneyFieldProps) {
  return (
    <TextField
      size="small"
      fullWidth
      required={required}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error}
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

// An account already on the order but missing from the staff list (e.g. a
// deactivated user) must stay selectable, or saving would silently drop it.
function withSelected(options: string[], selected: string[]): string[] {
  const extra = selected.filter((account) => !options.includes(account));
  return extra.length > 0 ? [...options, ...extra] : options;
}

export function OrderForm({
  saleOptions,
  floristOptions,
  initialValues,
  onSubmit,
  successMessage,
  submitLabel,
  resetLabel,
  requireChange = false,
  resetOnSuccess,
  onSuccess,
  onStale,
  onDirtyChange,
}: OrderFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  // The submit button is at the bottom of a long form; after a successful
  // create the form is blank, so bring the user back to the first field.
  const handleSuccess = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    onSuccess?.();
  };
  const {
    values,
    errors,
    conflicts,
    dirty,
    totals,
    setField,
    reset,
    dismissConflicts,
    submit,
    submitting,
    progress,
  } = useOrderForm({
    initialValues,
    onSubmit,
    successMessage,
    resetOnSuccess,
    onSuccess: handleSuccess,
    onStale,
  });

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  // The alert sits at the top; the user may be scrolled down at the save button.
  const conflictRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (conflicts.length > 0) {
      conflictRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [conflicts]);

  const saleChoices = useMemo(
    () => withSelected(saleOptions, values.saleAccounts),
    [saleOptions, values.saleAccounts],
  );
  const floristChoices = useMemo(
    () => withSelected(floristOptions, values.floristAccounts),
    [floristOptions, values.floristAccounts],
  );
  // A source that isn't one of the known options is kept selectable as-is.
  const sourceOptions = CUSTOMER_SOURCE_OPTIONS.some(
    (option) => option.value === values.customerSource,
  )
    ? CUSTOMER_SOURCE_OPTIONS
    : [
        ...CUSTOMER_SOURCE_OPTIONS,
        { label: values.customerSource, value: values.customerSource },
      ];

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
        {conflicts.length > 0 && (
          <Alert
            ref={conflictRef}
            severity="warning"
            onClose={dismissConflicts}
          >
            Đơn hàng đã được người khác chỉnh sửa. Các trường sau cả hai bên
            cùng thay đổi, đã giữ giá trị của bạn:{" "}
            {conflicts.map((field) => ORDER_FIELD_LABELS[field]).join(", ")}.
            Hãy kiểm tra lại trước khi lưu.
          </Alert>
        )}

        <Box sx={cardRow}>
          <Box sx={cardColumn}>
            <Section title="Thông tin khách hàng">
              <Box sx={fieldGrid}>
                <TextField
                  size="small"
                  required
                  label="Tên người đặt"
                  value={values.customerName}
                  error={Boolean(errors.customerName)}
                  helperText={errors.customerName}
                  disabled={submitting}
                  onChange={(e) => setField("customerName", e.target.value)}
                />
                <TextField
                  size="small"
                  required
                  label="Số điện thoại người đặt"
                  value={values.customerPhone}
                  error={Boolean(errors.customerPhone)}
                  helperText={errors.customerPhone}
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
                    {sourceOptions.map((option) => (
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
                  error={Boolean(errors.socialLink)}
                  helperText={errors.socialLink}
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
                  error={Boolean(errors.deliveryAddress)}
                  helperText={errors.deliveryAddress}
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
                  slotProps={{
                    textField: {
                      size: "small",
                      error: Boolean(errors.deliveryDateStart),
                      helperText: errors.deliveryDateStart,
                    },
                  }}
                />
                <DateTimePicker
                  ampm={false}
                  label="Thời gian muộn nhất phải giao"
                  value={values.deliveryDateEnd}
                  disabled={submitting}
                  onChange={(date) => date && setField("deliveryDateEnd", date)}
                  slotProps={{
                    textField: {
                      size: "small",
                      error: Boolean(errors.deliveryDateEnd),
                      helperText: errors.deliveryDateEnd,
                    },
                  }}
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
                  multiple
                  filterSelectedOptions
                  size="small"
                  options={saleChoices}
                  value={values.saleAccounts}
                  disabled={submitting}
                  onChange={(_, value) => setField("saleAccounts", value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Nhân viên sale"
                      error={Boolean(errors.saleAccounts)}
                      helperText={errors.saleAccounts}
                    />
                  )}
                />
                <Autocomplete
                  multiple
                  filterSelectedOptions
                  size="small"
                  options={floristChoices}
                  value={values.floristAccounts}
                  disabled={submitting}
                  onChange={(_, value) => setField("floristAccounts", value)}
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
                  error={errors.actualPrice}
                  value={values.actualPrice}
                  disabled={submitting}
                  onChange={(v) => setField("actualPrice", v)}
                />
                <MoneyField
                  label="Chiết khấu"
                  error={errors.discount}
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
                  error={errors.deposit}
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
              images={values.images}
              error={errors.images}
              disabled={submitting}
              onChange={(images) => setField("images", images)}
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
          <Button
            variant="outlined"
            disabled={submitting || !dirty}
            onClick={reset}
          >
            {resetLabel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || (requireChange && !dirty)}
          >
            {submitLabel}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
