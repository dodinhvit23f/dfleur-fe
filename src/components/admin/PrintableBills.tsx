import { Box } from "@mui/material";
import { forwardRef } from "react";
import { BillLayout } from "./BillLayout";
import type { Order } from "./orderUtils";

export interface PrintableBillsProps {
  orders: Order[];
  staffName?: string;
  includeImages: boolean;
  printedAt: Date;
}

// The node `react-to-print`'s `contentRef` points at. Kept separate from
// `BillLayout` so the print-target wiring stays isolated from the per-bill
// presentation.
export const PrintableBills = forwardRef<HTMLDivElement, PrintableBillsProps>(
  function PrintableBills(
    { orders, staffName, includeImages, printedAt }: PrintableBillsProps,
    ref,
  ) {
    return (
      <Box ref={ref}>
        {orders.map((order) => (
          <BillLayout
            key={order.orderCode}
            order={order}
            staffName={staffName}
            includeImage={includeImages}
            printedAt={printedAt}
          />
        ))}
      </Box>
    );
  },
);
