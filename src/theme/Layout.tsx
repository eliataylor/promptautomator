import React from 'react';
import {useLocation} from 'react-router-dom';
import {AppBar, Box, Grid} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Drawer from "@mui/material/Drawer";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DrawerMenu from "../components/DrawerMenu";
import LookupDrawer from "../components/LookupDrawer";
import {styled} from "@mui/material/styles";
import {useSourceData} from "../SourceDataContext";

const DrawerHeader = styled('div')(({theme}) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, .2, 0, 1),
    justifyContent: 'space-between',
}));

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({children}) => {
    const location = useLocation();

    const {selectedSourceId} = useSourceData();
    const [open, setOpen] = React.useState(false);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    return (
        <Box sx={{display: 'flex'}}>
            <Grid container>

                <Grid item>
                    <LookupDrawer/>
                </Grid>
                <Grid item
                      style={{width: selectedSourceId && window.innerWidth > 600 ? window.innerWidth - 300 : '100%'}}>
                    <AppBar position="sticky" color={'transparent'}>
                        <Grid container justifyContent={'space-between'} alignItems={'center'} padding={1} spacing={2}>
                            <Grid item>
                                OpenAI API Test Results
                            </Grid>

                            <Grid item style={{flexGrow: 1}}></Grid>

                            <Grid item>
                                <IconButton
                                    size={'large'}
                                    aria-label="open drawer"
                                    onClick={handleDrawerOpen}
                                >
                                    <MenuIcon/>
                                </IconButton>
                            </Grid>
                        </Grid>
                    </AppBar>
                    {children}
                </Grid>
            </Grid>
            <Drawer
                anchor="right"
                variant={"temporary"}
                open={open}
            >
                <DrawerHeader>
                    <IconButton onClick={handleDrawerClose}>
                        <ChevronRightIcon/>
                    </IconButton>
                </DrawerHeader>
                <DrawerMenu/>
            </Drawer>
        </Box>
    );
};

export default Layout;
