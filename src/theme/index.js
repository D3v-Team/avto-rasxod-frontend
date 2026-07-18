import { extendTheme } from "@chakra-ui/react";
import colors from "./tokens/colors";
import semanticTokens from "./tokens/semanticTokens";
import Button from "./components/Button";
import Select from "./components/Select";

const config = {
  initialColorMode: "light",
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  components: {
    Button,
    Select,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'light' ? "#f8fafc" : "#0f172a",
        color: props.colorMode === 'light' ? "#0f172a" : "#f8fafc",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        minHeight: '100vh',
      },
      "::selection": {
        bg: "#bfdbfe",
        color: "#0f172a",
        _dark: {
          bg: "#1d4ed8",
          color: "#f8fafc",
        },
      },
    }),
  },
});

export default theme;