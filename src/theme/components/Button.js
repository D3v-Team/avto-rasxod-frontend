const Button = {
    baseStyle: {
        borderRadius: "lg",
        fontWeight: "600",
        letterSpacing: "0.2px",
        transition: "all 0.3s ease",
        _focus: {
            boxShadow: "0 0 0 3px rgba(249, 115, 22, 0.3)",
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
        // Asosiy - sabzi
        solidPrimary: {
            bg: "primary.500",
            color: "white",
            _hover: { 
                bg: "primary.600",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
            },
            _active: { 
                bg: "primary.700",
                transform: "translateY(0)",
            },
        },

        // Ikkilamchi - sariq
        solidSecondary: {
            bg: "secondary.500",
            color: "white",
            _hover: { 
                bg: "secondary.600",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(234, 179, 8, 0.3)",
            },
            _active: { 
                bg: "secondary.700",
                transform: "translateY(0)",
            },
        },

        // Aksent - qizil
        solidAccent: {
            bg: "accent.500",
            color: "white",
            _hover: { 
                bg: "accent.600",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            },
            _active: { 
                bg: "accent.700",
                transform: "translateY(0)",
            },
        },

        // Amber
        solidAmber: {
            bg: "amber.500",
            color: "white",
            _hover: { 
                bg: "amber.600",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
            },
            _active: { 
                bg: "amber.700",
                transform: "translateY(0)",
            },
        },

        // Outline - sabzi
        outlinePrimary: {
            border: "2px solid",
            borderColor: "primary.500",
            color: "primary.500",
            bg: "transparent",
            _hover: {
                bg: "primary.50",
                transform: "translateY(-1px)",
                _dark: {
                    bg: "primary.900",
                },
            },
            _active: {
                bg: "primary.100",
                _dark: {
                    bg: "primary.800",
                },
            }
        },

        // Outline - sariq
        outlineSecondary: {
            border: "2px solid",
            borderColor: "secondary.500",
            color: "secondary.500",
            bg: "transparent",
            _hover: {
                bg: "secondary.50",
                transform: "translateY(-1px)",
                _dark: {
                    bg: "secondary.900",
                },
            },
            _active: {
                bg: "secondary.100",
                _dark: {
                    bg: "secondary.800",
                },
            }
        },

        // Soft - yumshoq sabzi
        soft: {
            bg: "primary.100",
            color: "primary.700",
            _hover: {
                bg: "primary.200",
                transform: "translateY(-1px)",
                _dark: {
                    bg: "primary.800",
                    color: "primary.200",
                },
            },
            _active: {
                bg: "primary.300",
                _dark: {
                    bg: "primary.700",
                },
            }
        },

        // Success
        solidSuccess: {
            bg: "green.500",
            color: "white",
            _hover: { 
                bg: "green.600",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
            },
            _active: { 
                bg: "green.700",
                transform: "translateY(0)",
            },
        },

        // Danger
        solidDanger: {
            bg: "red.500",
            color: "white",
            _hover: { 
                bg: "red.600",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            },
            _active: { 
                bg: "red.700",
                transform: "translateY(0)",
            },
        },

        // Ghost
        ghost: {
            bg: "transparent",
            color: "text",
            _hover: {
                bg: "neutral.100",
                transform: "translateY(-1px)",
                _dark: { bg: "neutral.700" },
            },
            _active: {
                bg: "neutral.200",
                _dark: { bg: "neutral.600" },
            }
        },
    },

    defaultProps: {
        size: "md",
        variant: "solidPrimary",
    },
};

export default Button;