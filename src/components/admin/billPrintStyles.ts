// A5 portrait bill printing. `.bill-page` is a plain, stable class name (not an
// Emotion-generated one) so this stylesheet — handed to `useReactToPrint`'s
// `pageStyle` option — can reliably target it inside the print iframe.
//
// `box-sizing: border-box` keeps the 10mm padding inside the 148mm page width
// instead of pushing content past it (which would otherwise clip content or
// spill an extra blank page). `.bill-page:last-child` (not a hardcoded count)
// is what makes "no trailing blank page" work regardless of whether each order
// contributes one page (no image) or two (bill + image page).
export const A5_BILL_PRINT_STYLE = `
  @page {
    size: A5;
    margin: 0;
  }

  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
    }

    .bill-page {
      box-sizing: border-box;
      width: 148mm;
      min-height: 210mm;
      padding: 10mm;
      background: #fff !important;
      color: #000 !important;
      page-break-after: always;
      break-after: page;
    }

    .bill-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .bill-page * {
      color: #000 !important;
      background: transparent !important;
      box-shadow: none !important;
      border-color: #000 !important;
    }

    .bill-page img {
      max-width: 100%;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;
