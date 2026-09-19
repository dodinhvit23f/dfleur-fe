import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { getAccount } from "@/lib/storage";
import { useNotification } from "@/providers/NotificationProvider";
import { A5_BILL_PRINT_STYLE } from "./billPrintStyles";
import type { Order } from "./orderUtils";

// Isolates the browser/print-API concerns (react-to-print wiring, the bill
// date, print-status feedback) from PrintOrdersDialog's JSX.
export function useBillPrint(orders: Order[], open: boolean) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { notifySuccess, notifyError } = useNotification();
  const [includeImages, setIncludeImages] = useState(true);
  const [printedAt, setPrintedAt] = useState(() => new Date());
  const [isPrinting, setIsPrinting] = useState(false);

  // Re-stamp the bill date each time the dialog opens, so every bill in one
  // print job shares the same issued-at instant rather than drifting across
  // renders.
  useEffect(() => {
    if (open) setPrintedAt(new Date());
  }, [open]);

  const staffName = getAccount();

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `hoa-don-${orders.map((order) => order.orderCode).join("-")}`,
    pageStyle: A5_BILL_PRINT_STYLE,
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      notifySuccess("Đã gửi lệnh in hóa đơn");
    },
    onPrintError: () => {
      setIsPrinting(false);
      notifyError("In hóa đơn thất bại. Vui lòng thử lại.");
    },
  });

  return {
    contentRef,
    includeImages,
    setIncludeImages,
    staffName,
    printedAt,
    isPrinting,
    handlePrint,
  };
}
