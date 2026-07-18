const Select = {
    parts: ["field", "icon"],

    baseStyle: {
        field: {
            borderRadius: "lg",
            fontWeight: "500",
            bg: "white",
            color: "text",
            border: "1.5px solid",
            borderColor: "neutral.200",
            transition: "all 0.3s ease",
            _placeholder: {
                color: "neutral.400",
            },
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
                _hover: {
                    borderColor: "primary.400",
                    boxShadow: "0 2px 8px rgba(249, 115, 22, 0.2)",
                },
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
        icon: {
            color: "primary.500",
            _dark: { color: "primary.400" },
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
        // Standart
        filledPrimary: {
            field: {
                bg: "white",
                borderColor: "neutral.200",
                _dark: {
                    bg: "neutral.800",
                    borderColor: "neutral.700",
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

        // Soft - yumshoq sabzi
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

        // Outline
        outlinePrimary: {
            field: {
                bg: "transparent",
                borderWidth: "1.5px",
                borderColor: "neutral.300",
                _dark: {
                    borderColor: "neutral.600",
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

        // Amber
        amber: {
            field: {
                bg: "amber.50",
                borderColor: "amber.300",
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

        // Clean
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
        variant: "filledPrimary",
    },
};

export default Select;