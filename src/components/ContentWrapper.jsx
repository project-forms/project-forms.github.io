import { Box } from "@primer/react";
import PropTypes from "prop-types";

/**
 * @param {object} options
 * @param {import("react").ReactNode} options.children
 * @param {import("@primer/react/lib-esm/sx").BetterSystemStyleObject} [options.sx]
 * @returns
 */
export default function ContentWrapper({ children, sx }) {
  return (
    <Box
      sx={{
        p: 4,
        m: "0 auto",
        maxWidth: "1280px",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

ContentWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  sx: PropTypes.object,
};
