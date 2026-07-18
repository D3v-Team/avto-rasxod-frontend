const Button = {
    baseStyle: {
        borderRadius: "lg",
        fontWeight: "600",
        letterSpacing: "0.2px",
        transition: "all 0.3s ease",
        _focus: {
            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)",
        },
    },
    sizes: {
        xl: {
            fontSize: "lg",
            px: 8,
            py: 5,
            borderRadius: "xl",
        },
        lg: {
            fontSize: "md",
            px: 6,
            py: 4,
        },
        md: {
            fontSize: "sm",
            px: 5,
            py: 3,
        },
        sm: {
            fontSize: "xs",
            px: 4,
            py: 2,
        },
    },

    variants: {
        solidPrimary: {
            bg: "#3B82F6",
            color: "white",
            _hover: { 
                bg: "#2563eb",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            },
            _active: { 
                bg: "#1d4ed8",
                transform: "translateY(0)",
            },
        },

        solidSecondary: {
            bg: "#0EA5E9",
            color: "white",
            _hover: { 
                bg: "#0284c7",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)",
            },
            _active: { 
                bg: "#0369a1",
                transform: "translateY(0)",
            },
        },

        solidAccent: {
            bg: "#6366F1",
            color: "white",
            _hover: { 
                bg: "#4f46e5",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            },
            _active: { 
                bg: "#4338ca",
                transform: "translateY(0)",
            },
        },

        outlinePrimary: {
            border: "2px solid",
            borderColor: "#3B82F6",
            color: "#3B82F6",
            bg: "transparent",
            _hover: {
                bg: "#eff6ff",
                transform: "translateY(-1px)",
                _dark: {
                    bg: "#1e3a8a",
                },
            },
            _active: {
                bg: "#dbeafe",
                _dark: {
                    bg: "#1e40af",
                },
            }
        },

        soft: {
            bg: "#eff6ff",
            color: "#1d4ed8",
            _hover: {
                bg: "#dbeafe",
                transform: "translateY(-1px)",
                _dark: {
                    bg: "#1e3a8a",
                    color: "#60a5fa",
                },
            },
            _active: {
                bg: "#bfdbfe",
                _dark: {
                    bg: "#1e40af",
                },
            }
        },

        solidSuccess: {
            bg: "#22C55E",
            color: "white",
            _hover: { 
                bg: "#16a34a",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
            },
            _active: { 
                bg: "#15803d",
                transform: "translateY(0)",
            },
        },

        solidDanger: {
            bg: "#EF4444",
            color: "white",
            _hover: { 
                bg: "#dc2626",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            },
            _active: { 
                bg: "#b91c1c",
                transform: "translateY(0)",
            },
        },

        ghost: {
            bg: "transparent",
            color: "#0f172a",
            _hover: {
                bg: "#f1f5f9",
                transform: "translateY(-1px)",
                _dark: { 
                    bg: "#334155",
                    color: "#f8fafc",
                },
            },
            _active: {
                bg: "#e2e8f0",
                _dark: { bg: "#475569" },
            }
        },
    },

    defaultProps: {
        size: "md",
        variant: "solidPrimary",
    },
};

export default Button;