import { Box, Divider, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  formatContact,
  formatVnd,
  getDeliveryWindow,
  hasSamplePicture,
  type Order,
} from "./orderUtils";

export interface BillLayoutProps {
  order: Order;
  staffName?: string;
  includeImage: boolean;
  printedAt: Date;
}

const DELIVERY_FEE_OPTION_LABEL: Record<number, string> = {
  0: "Cửa hàng trả phí",
  1: "Khách trả phí",
  2: "Khách trả phí + VAT",
};

function PaymentRow({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
      <Typography variant="body2" sx={{ fontWeight: emphasized ? 700 : 400 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: emphasized ? 700 : 400 }}>
        {value}
      </Typography>
    </Box>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        variant="overline"
        sx={{ color: "text.secondary", letterSpacing: 1 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export function BillLayout({
  order,
  staffName,
  includeImage,
  printedAt,
}: BillLayoutProps) {
  const delivery = getDeliveryWindow(
    order.deliveryDateStart,
    order.deliveryDateEnd,
  );
  const deliveryTimeLine = delivery.sameDay
    ? `${delivery.startDate} · ${delivery.startTime} - ${delivery.endTime}`
    : `${delivery.startDate} ${delivery.startTime} → ${delivery.endDate} ${delivery.endTime}`;
  const showImagePage =
    includeImage && hasSamplePicture(order.samplePictureLink);

  return (
    <>
      <Box className="bill-page">
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main">
            D Fleur
          </Typography>
          <Typography variant="overline" color="text.secondary">
            Home of Flower Lovers
          </Typography>
        </Stack>

        <Typography
          variant="h6"
          align="center"
          sx={{ letterSpacing: 1, mb: 1 }}
        >
          HÓA ĐƠN BÁN HÀNG
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="body2">Mã đơn: {order.orderCode}</Typography>
          <Typography variant="body2">
            Ngày in: {printedAt.toLocaleDateString("vi-VN")}
          </Typography>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Section title="Khách hàng">
          <Typography variant="body2">{order.customerName || "—"}</Typography>
          <Typography variant="body2">{order.customerPhone || "—"}</Typography>
          {order.orderDescription && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {order.orderDescription}
            </Typography>
          )}
        </Section>

        <Section title="Giao hàng">
          <Typography variant="body2">
            {formatContact(order.receiverName, order.receiverPhone) || "—"}
          </Typography>
          <Typography variant="body2">
            {order.deliveryAddress || "—"}
          </Typography>
          <Typography variant="body2">{deliveryTimeLine}</Typography>
        </Section>

        <Section title="Thanh toán">
          <PaymentRow
            label="Giá niêm yết"
            value={formatVnd(order.actualPrice)}
          />
          {order.discountAmount > 0 && (
            <PaymentRow
              label="Giảm giá"
              value={`-${formatVnd(order.discountAmount)}`}
            />
          )}
          <PaymentRow label="Giá bán" value={formatVnd(order.salePrice)} />
          {order.deliveryFee > 0 && (
            <PaymentRow
              label={`Phí giao hàng (${DELIVERY_FEE_OPTION_LABEL[order.deliveryFeeOption] ?? "—"})`}
              value={formatVnd(order.deliveryFee)}
            />
          )}
          {order.vatFee > 0 && (
            <PaymentRow label="VAT" value={formatVnd(order.vatFee)} />
          )}
          <Divider sx={{ my: 0.5 }} />
          <PaymentRow
            label="Tổng cộng"
            value={formatVnd(order.totalAmount)}
            emphasized
          />
          <PaymentRow
            label="Đã đặt cọc"
            value={formatVnd(order.depositAmount)}
          />
          <PaymentRow
            label="Còn lại"
            value={formatVnd(order.remainingAmount)}
          />
        </Section>

        <Divider sx={{ mt: 3, mb: 1 }} />
        <Typography variant="caption" color="text.secondary">
          In bởi {staffName ?? "—"}
        </Typography>
      </Box>

      {showImagePage && (
        <Box
          className="bill-page"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* biome-ignore lint/performance/noImgElement: remote Google Drive URL, not an optimizable local asset */}
          <img
            src={`${order.samplePictureLink[0]}&sz=s1200`}
            alt={`Ảnh mẫu ${order.orderCode}`}
            style={{
              maxWidth: "100%",
              maxHeight: "190mm",
              objectFit: "contain",
            }}
          />
        </Box>
      )}
    </>
  );
}
