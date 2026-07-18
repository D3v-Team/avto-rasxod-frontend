const Select = {
    parts: ["field", "icon"],

    baseStyle: {
        field: {
            borderRadius: "lg",
            fontWeight: "500",
            bg: "white",
            color: "#0f172a",
            border: "1.5px solid",
            borderColor: "#e2e8f0",
            transition: "all 0.3s ease",
            _placeholder: {
                color: "#94a3b8",
            },
            _hover: {
                borderColor: "#3B82F6",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.1)",
            },
            _focus: {
                borderColor: "#3B82F6",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.15)",
            },
            _dark: {
                bg: "#1e293b",
                borderColor: "#334155",
                color: "#f8fafc",
                _hover: {
                    borderColor: "#60a5fa",
                    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)",
                },
            },
            _disabled: {
                opacity: 0.6,
                cursor: "not-allowed",
            },
            _invalid: {
                borderColor: "#EF4444",
                boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.15)",
            },
        },
        icon: {
            color: "#3B82F6",
            _dark: { color: "#60a5fa" },
        },
    },

    sizes: {
        xl: {
            field: {
                fontSize: "lg",
                px: 6,
                py: 4,
                borderRadius: "xl",
            },
            icon: {
                w: 6,
                h: 6,
            },
        },
        lg: {
            field: {
                fontSize: "md",
                px: 5,
                py: 3,
                borderRadius: "lg",
            },
            icon: {
                w: 5,
                h: 5,
            },
        },
        md: {
            field: {
                fontSize: "sm",
                px: 4,
                py: 2.5,
            },
            icon: {
                w: 5,
                h: 5,
            },
        },
        sm: {
            field: {
                fontSize: "xs",
                px: 3,
                py: 2,
            },
            icon: {
                w: 4,
                h: 4,
            },
        },
    },

    variants: {
        filledPrimary: {
            field: {
                bg: "white",
                borderColor: "#e2e8f0",
                _dark: {
                    bg: "#1e293b",
                    borderColor: "#334155",
                },
                _hover: {
                    borderColor: "#3B82F6",
                },
                _focus: {
                    borderColor: "#3B82F6",
                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.15)",
                },
            },
        },

        soft: {
            field: {
                bg: "#eff6ff",
                borderColor: "#bfdbfe",
                _dark: {
                    bg: "#1e3a8a",
                    borderColor: "#1d4ed8",
                },
                _hover: {
                    borderColor: "#3B82F6",
                },
                _focus: {
                    borderColor: "#3B82F6",
                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.15)",
                },
            },
        },

        outlinePrimary: {
            field: {
                bg: "transparent",
                borderWidth: "1.5px",
                borderColor: "#cbd5e1",
                _dark: {
                    borderColor: "#334155",
                },
                _hover: {
                    borderColor: "#3B82F6",
                },
                _focus: {
                    borderColor: "#3B82F6",
                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.15)",
                },
            },
        },

        clean: {
            field: {
                bg: "transparent",
                border: "none",
                borderBottom: "2px solid",
                borderColor: "#e2e8f0",
                borderRadius: "0",
                _dark: {
                    borderColor: "#334155",
                },
                _hover: {
                    borderColor: "#3B82F6",
                },
                _focus: {
                    borderColor: "#3B82F6",
                    boxShadow: "none",
                },
            },
        },
    },

    defaultProps: {
        size: "md",
        variant: "filledPrimary",
    },
};

export default Select;