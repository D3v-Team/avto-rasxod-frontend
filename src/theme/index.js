import { extendTheme } from "@chakra-ui/react";
import colors from "./tokens/colors";
import semanticTokens from "./tokens/semanticTokens";

// Components
import Button from "./components/Button";
import Select from "./components/Select";

const config = {
  initialColorMode: "light",
  useSystemColorMode: true,
};

// Badge
const Badge = {
  baseStyle: {
    borderRadius: "lg",
    px: 3,
    py: 1.5,
    fontWeight: "600",
    letterSpacing: "0.2px",
    fontSize: "xs",
    textTransform: "uppercase",
    display: "inline-flex",
    alignItems: "center",
    gap: 1.5,
    transition: "all 0.3s ease",
  },
  variants: {
    onRoad: {
      bg: "successBg",
      color: "success",
      border: "1px solid",
      borderColor: "success",
    },
    inRepair: {
      bg: "dangerBg",
      color: "danger",
      border: "1px solid",
      borderColor: "danger",
    },
    available: {
      bg: "availableBg",
      color: "available",
      border: "1px solid",
      borderColor: "available",
    },
    pending: {
      bg: "warningBg",
      color: "warning",
      border: "1px solid",
      borderColor: "warning",
    },
    completed: {
      bg: "completedBg",
      color: "completed",
      border: "1px solid",
      borderColor: "completed",
    },
    primary: {
      bg: "primary.100",
      color: "primary.600",
      border: "1px solid",
      borderColor: "primary.300",
      _dark: {
        bg: "primary.900",
        color: "primary.300",
        borderColor: "primary.700",
      },
    },
    secondary: {
      bg: "secondary.100",
      color: "secondary.600",
      border: "1px solid",
      borderColor: "secondary.300",
      _dark: {
        bg: "secondary.900",
        color: "secondary.300",
        borderColor: "secondary.700",
      },
    },
    accent: {
      bg: "accent.100",
      color: "accent.600",
      border: "1px solid",
      borderColor: "accent.300",
      _dark: {
        bg: "accent.900",
        color: "accent.300",
        borderColor: "accent.700",
      },
    },
    amber: {
      bg: "amber.100",
      color: "amber.600",
      border: "1px solid",
      borderColor: "amber.300",
      _dark: {
        bg: "amber.900",
        color: "amber.300",
        borderColor: "amber.700",
      },
    },
    soft: {
      bg: "primary.50",
      color: "primary.600",
      border: "none",
      _dark: {
        bg: "primary.900",
        color: "primary.300",
      },
    },
  },
  defaultProps: {
    variant: "primary",
  },
};

// Card
const Card = {
  baseStyle: {
    container: {
      bg: "surface",
      borderRadius: "xl",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      border: "1px solid",
      borderColor: "border",
      p: 6,
      transition: "all 0.3s ease",
      _hover: {
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
        transform: "translateY(-2px)",
      },
      _dark: {
        bg: "surface",
        borderColor: "neutral.700",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        _hover: {
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
        },
      },
    },
    header: {
      borderBottom: "1px solid",
      borderColor: "border",
      pb: 4,
      mb: 4,
      fontWeight: "600",
      fontSize: "lg",
      color: "text",
    },
    body: {
      py: 2,
    },
    footer: {
      borderTop: "1px solid",
      borderColor: "border",
      pt: 4,
      mt: 4,
    },
  },
  variants: {
    soft: {
      container: {
        bg: "primary.50",
        border: "none",
        _dark: {
          bg: "primary.900",
        },
        _hover: {
          boxShadow: "0 4px 16px rgba(249, 115, 22, 0.1)",
        },
      },
    },
    elevated: {
      container: {
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06)",
        border: "none",
        _hover: {
          boxShadow: "0 12px 48px rgba(0, 0, 0, 0.08)",
        },
      },
    },
    amber: {
      container: {
        bg: "amber.50",
        border: "1px solid",
        borderColor: "amber.200",
        _dark: {
          bg: "amber.900",
          borderColor: "amber.700",
        },
        _hover: {
          boxShadow: "0 4px 16px rgba(245, 158, 11, 0.1)",
        },
      },
    },
    simple: {
      container: {
        boxShadow: "none",
        border: "1px solid",
        borderColor: "border",
        _hover: {
          boxShadow: "none",
          transform: "none",
        },
      },
    },
  },
  defaultProps: {
    variant: null,
  },
};

// Input
const Input = {
  baseStyle: {
    field: {
      borderRadius: "lg",
      bg: "white",
      color: "text",
      border: "1.5px solid",
      borderColor: "neutral.200",
      transition: "all 0.3s ease",
      _hover: {
        borderColor: "primary.400",
        boxShadow: "0 2px 8px rgba(249, 115, 22, 0.1)",
      },
      _focus: {
        borderColor: "primary.500",
        boxShadow: "0 0 0 3px rgba(249, 115, 22, 0.15)",
      },
      _dark: {
        bg: "neutral.800",
        borderColor: "neutral.700",
        color: "neutral.100",
        _hover: {
          borderColor: "primary.400",
          boxShadow: "0 2px 8px rgba(249, 115, 22, 0.2)",
        },
      },
      _placeholder: {
        color: "neutral.400",
      },
      _disabled: {
        opacity: 0.6,
        cursor: "not-allowed",
      },
      _invalid: {
        borderColor: "danger",
        boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.15)",
      },
    },
  },
  sizes: {
    xl: {
      field: {
        fontSize: "lg",
        px: 6,
        py: 4,
        borderRadius: "xl",
        height: "auto",
      },
    },
    lg: {
      field: {
        fontSize: "md",
        px: 5,
        py: 3,
        borderRadius: "lg",
        height: "auto",
      },
    },
    md: {
      field: {
        fontSize: "sm",
        px: 4,
        py: 2.5,
        height: "auto",
      },
    },
    sm: {
      field: {
        fontSize: "xs",
        px: 3,
        py: 2,
        height: "auto",
      },
    },
  },
  variants: {
    outline: {
      field: {
        bg: "transparent",
        borderWidth: "1.5px",
        borderColor: "neutral.300",
        _dark: {
          borderColor: "neutral.600",
        },
      },
    },
    filled: {
      field: {
        bg: "neutral.100",
        borderColor: "transparent",
        _dark: {
          bg: "neutral.700",
        },
        _hover: {
          bg: "neutral.200",
          _dark: {
            bg: "neutral.600",
          },
        },
        _focus: {
          bg: "white",
          borderColor: "primary.500",
          _dark: {
            bg: "neutral.800",
          },
        },
      },
    },
    soft: {
      field: {
        bg: "primary.50",
        borderColor: "primary.200",
        _dark: {
          bg: "primary.900",
          borderColor: "primary.700",
        },
        _hover: {
          borderColor: "primary.400",
          boxShadow: "0 2px 8px rgba(249, 115, 22, 0.1)",
        },
        _focus: {
          borderColor: "primary.500",
          boxShadow: "0 0 0 3px rgba(249, 115, 22, 0.15)",
        },
      },
    },
    amber: {
      field: {
        bg: "amber.50",
        borderColor: "amber.200",
        color: "amber.800",
        _dark: {
          bg: "amber.900",
          borderColor: "amber.700",
          color: "amber.100",
        },
        _hover: {
          borderColor: "amber.400",
          boxShadow: "0 2px 8px rgba(245, 158, 11, 0.1)",
        },
        _focus: {
          borderColor: "amber.500",
          boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.15)",
        },
      },
    },
    clean: {
      field: {
        bg: "transparent",
        border: "none",
        borderBottom: "2px solid",
        borderColor: "neutral.200",
        borderRadius: "0",
        _dark: {
          borderColor: "neutral.700",
        },
        _hover: {
          borderColor: "primary.400",
        },
        _focus: {
          borderColor: "primary.500",
          boxShadow: "none",
        },
      },
    },
  },
  defaultProps: {
    size: "md",
    variant: "outline",
  },
};

// Menu
const Menu = {
  baseStyle: {
    list: {
      borderRadius: "xl",
      bg: "surface",
      border: "1px solid",
      borderColor: "border",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06)",
      py: 2,
      overflow: "hidden",
      _dark: {
        bg: "neutral.800",
        borderColor: "neutral.700",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      },
    },
    item: {
      px: 4,
      py: 2.5,
      transition: "all 0.2s ease",
      _hover: {
        bg: "primary.50",
        color: "primary.600",
        _dark: {
          bg: "primary.900",
          color: "primary.300",
        },
      },
      _focus: {
        bg: "secondary.50",
        color: "secondary.600",
        _dark: {
          bg: "secondary.900",
          color: "secondary.300",
        },
      },
    },
    button: {
      transition: "all 0.2s ease",
      _hover: {
        bg: "primary.50",
        _dark: {
          bg: "primary.900",
        },
      },
    },
  },
  defaultProps: {
    variant: null,
  },
};

// Table
const Table = {
  variants: {
    modern: {
      table: {
        borderCollapse: "separate",
        borderSpacing: "0 6px",
        width: "100%",
      },
      th: {
        bg: "transparent",
        color: "textSecondary",
        fontWeight: "600",
        textTransform: "uppercase",
        fontSize: "xs",
        letterSpacing: "0.5px",
        py: 3,
        px: 4,
        textAlign: "left",
        border: "none",
      },
      td: {
        bg: "surface",
        py: 4,
        px: 4,
        border: "none",
        _first: {
          borderTopLeftRadius: "lg",
          borderBottomLeftRadius: "lg",
        },
        _last: {
          borderTopRightRadius: "lg",
          borderBottomRightRadius: "lg",
        },
        _dark: {
          bg: "neutral.800",
        },
      },
      tbody: {
        tr: {
          _hover: {
            td: {
              bg: "primary.50",
              _dark: {
                bg: "primary.900",
              },
            },
          },
        },
      },
    },
    striped: {
      th: {
        bg: "primary.50",
        color: "primary.700",
        fontWeight: "600",
        textTransform: "uppercase",
        fontSize: "xs",
        letterSpacing: "0.5px",
        borderBottom: "none",
        py: 3,
        px: 4,
        textAlign: "left",
        _dark: {
          bg: "primary.900",
          color: "primary.300",
        },
      },
      td: {
        borderBottom: "1px solid",
        borderColor: "border",
        py: 3,
        px: 4,
        _dark: {
          borderColor: "neutral.700",
        },
      },
      tbody: {
        tr: {
          _hover: {
            bg: "primary.50",
            _dark: {
              bg: "primary.900",
            },
          },
        },
      },
    },
    amber: {
      th: {
        bg: "amber.50",
        color: "amber.700",
        fontWeight: "600",
        textTransform: "uppercase",
        fontSize: "xs",
        letterSpacing: "0.5px",
        borderBottom: "none",
        py: 3,
        px: 4,
        textAlign: "left",
        _dark: {
          bg: "amber.900",
          color: "amber.300",
        },
      },
      td: {
        borderBottom: "1px solid",
        borderColor: "border",
        py: 3,
        px: 4,
        _dark: {
          borderColor: "neutral.700",
        },
      },
      tbody: {
        tr: {
          _hover: {
            bg: "amber.50",
            _dark: {
              bg: "amber.900",
            },
          },
        },
      },
    },
  },
  defaultProps: {
    variant: "modern",
  },
};

const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  components: {
    Button,
    Select,
    Badge,
    Card,
    Input,
    Menu,
    Table,
  },
  styles: {
    global: {
      body: {
        bg: "bg",
        color: "text",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      },
      "::selection": {
        bg: "primary.200",
        color: "primary.900",
        _dark: {
          bg: "primary.700",
          color: "white",
        },
      },
      a: {
        color: "link",
        transition: "color 0.2s ease",
        _hover: {
          color: "accent.500",
          _dark: {
            color: "accent.400",
          },
        },
      },
    },
  },
});

export default theme;
