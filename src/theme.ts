import { alpha, createTheme } from "@mui/material/styles";

// Brand palette
const warmGold = "#D18628";
const softRose = "#EBB4B1";
const deepBronze = "#3D271D";
const creamLinen = "#F7F4EF";
const mutedSage = "#9E9D89";

const headingFontFamily = "var(--font-playfair-display), 'Bodoni MT', serif";
const bodyFontFamily = "var(--font-montserrat), 'Lato', sans-serif";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: warmGold,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: softRose,
      contrastText: deepBronze,
    },
    background: {
      default: creamLinen,
      paper: "#FFFFFF",
    },
    text: {
      primary: deepBronze,
      secondary: mutedSage,
    },
    divider: alpha(mutedSage, 0.3),
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: bodyFontFamily,
    h1: { fontFamily: headingFontFamily, fontWeight: 700 },
    h2: { fontFamily: headingFontFamily, fontWeight: 700 },
    h3: { fontFamily: headingFontFamily, fontWeight: 600 },
    h4: { fontFamily: headingFontFamily, fontWeight: 600 },
    h5: { fontFamily: headingFontFamily, fontWeight: 600 },
    h6: { fontFamily: headingFontFamily, fontWeight: 600 },
    subtitle1: { fontFamily: bodyFontFamily },
    subtitle2: { fontFamily: bodyFontFamily },
    body1: { fontFamily: bodyFontFamily },
    body2: { fontFamily: bodyFontFamily },
    button: {
      fontFamily: bodyFontFamily,
      textTransform: "none",
      fontWeight: 600,
    },
    caption: { fontFamily: bodyFontFamily },
    overline: { fontFamily: bodyFontFamily },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          padding: "10px 24px",
          transition:
            "background-color 200ms ease, box-shadow 200ms ease, transform 150ms ease",
          "&:active": {
            transform: "scale(0.98)",
          },
          "&.Mui-disabled": {
            backgroundColor: alpha(mutedSage, 0.25),
            color: alpha(mutedSage, 0.8),
          },
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: `0 4px 14px ${alpha(warmGold, 0.35)}`,
          },
        },
        outlined: {
          borderColor: mutedSage,
          "&:hover": {
            borderColor: warmGold,
            backgroundColor: alpha(warmGold, 0.06),
          },
        },
        text: {
          "&:hover": {
            backgroundColor: alpha(softRose, 0.12),
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(mutedSage, 0.6),
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: mutedSage,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: warmGold,
            borderWidth: 2,
          },
          "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(mutedSage, 0.3),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputLabel-root.Mui-focused": {
            color: warmGold,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${alpha(mutedSage, 0.2)}`,
          boxShadow: `0 2px 12px ${alpha(deepBronze, 0.08)}`,
          backgroundImage: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        elevation1: {
          boxShadow: `0 2px 10px ${alpha(deepBronze, 0.06)}`,
          border: `1px solid ${alpha(softRose, 0.25)}`,
        },
      },
    },
  },
});

export default theme;
