import React, {useState} from 'react';
import {IconButton, Popover} from '@mui/material';
import MoreVert from '@mui/icons-material/MoreVert';

interface MoreMenuProps {
  children: React.ReactNode;
}

const MoreMenu: React.FC<MoreMenuProps> = ({ children }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'more-menu-popover' : undefined;

  return (
    <div>
      <IconButton onClick={handlePopoverOpen}>
        <MoreVert />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <div style={{ padding: '16px' }}>
          {children}
        </div>
      </Popover>
    </div>
  );
};

export default MoreMenu;
