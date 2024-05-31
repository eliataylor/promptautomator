import React from 'react';
import { GlobalStyles } from '@mui/material';
import { Theme } from '@mui/material/styles';

const GlobalLinkStyles: React.FC = () => (
  <GlobalStyles
    styles={(theme: Theme) => ({
      'a, a:visited': {
          // @ts-ignore
        color: theme.palette.link.main,
        textDecoration: 'underline',
      },
      'a:hover, a:focus': {
          // @ts-ignore
        color: theme.palette.link.dark,
        textDecoration: 'underline',
      },
    })}
  />
);

export default GlobalLinkStyles;