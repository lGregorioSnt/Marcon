"use client";

import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Box, Button, Typography, Avatar, IconButton, 
  Divider, Tooltip 
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

// Ícones
import HomeIcon from "@mui/icons-material/Home";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import BuildIcon from '@mui/icons-material/Build';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Topbar() {
  const [user, setUser] = useState({ nome: 'Usuário', perfil: 'Acesso' });
  const [montado, setMontado] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMontado(true);
    const savedUser = localStorage.getItem('marcon_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Erro ao ler dados do usuário");
      }
    }
  }, []);

  if (pathname === '/login' || !montado) return null;

  const marconBlue = "#00509d";
  const darkGray = "#1A1C1E";

  const handleLogout = () => {
    Cookies.remove('marcon_token');
    localStorage.removeItem('marcon_user');
    localStorage.removeItem('marcon_token');
    window.location.href = '/login';
  };

  const navItemStyle = (path: string) => ({
    color: pathname === path ? marconBlue : '#64748B',
    fontWeight: pathname === path ? 700 : 600, // Fonte mais elegante e dinâmica
    textTransform: 'none',
    px: 2.5,
    py: 1,
    borderRadius: 2.5,
    fontSize: '0.9rem',
    letterSpacing: '0.2px',
    bgcolor: pathname === path ? 'rgba(0, 80, 157, 0.08)' : 'transparent',
    '&:hover': {
      bgcolor: pathname === path ? 'rgba(0, 80, 157, 0.12)' : '#F1F5F9',
      color: pathname === path ? marconBlue : darkGray, // Escurece levemente no hover
    },
    transition: 'all 0.2s ease-in-out'
  });

  return (
    <AppBar 
      position="sticky" 
      elevation={0} 
      sx={{ 
        bgcolor: 'white', 
        borderBottom: '1px solid #E2E8F0', 
        zIndex: 1100 
      }}
    >
      <Toolbar 
        sx={{ 
          justifyContent: 'space-between', 
          px: { xs: 2, md: 5 }, 
          height: 72, // Aumentado para dar mais respiro
          minHeight: '72px !important' 
        }}
      >
        
        {/* LOGO + NAV */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Image 
              src="/logo.png" 
              alt="Marcon Logo" 
              width={140} 
              height={45} 
              style={{ 
                objectFit: 'contain',
                transform: 'scale(1.5)',
                transformOrigin: 'left center'
              }} 
              priority
            />
          </Link>
          
          <Divider 
            orientation="vertical" 
            flexItem 
            sx={{ 
              height: 32, 
              alignSelf: 'center', 
              mx: 1,
              borderColor: '#E2E8F0',
              display: { xs: 'none', lg: 'block' } 
            }} 
          />

          {/* NAVIGATION */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 0.5 }}>
            
            <Button 
              component={Link} 
              href="/" 
              sx={navItemStyle('/')} 
              startIcon={<HomeIcon sx={{ fontSize: '1.2rem' }} />}
            >
              Visão Geral
            </Button>

             <Button 
              component={Link} 
              href="/dashboard" 
              sx={navItemStyle('/dashboard')} 
              startIcon={<DashboardIcon sx={{ fontSize: '1.2rem' }} />}
            >
              Dashboard
            </Button>

            <Button 
              component={Link} 
              href="/devolucao" 
              sx={navItemStyle('/devolucao')} 
              startIcon={<AssignmentReturnIcon sx={{ fontSize: '1.2rem' }} />}
            >
              Devoluções
            </Button>

            <Button 
              component={Link} 
              href="/rastreabilidade" 
              sx={navItemStyle('/rastreabilidade')} 
              startIcon={<HistoryIcon sx={{ fontSize: '1.2rem' }} />}
            >
              Rastreabilidade
            </Button>

            <Button 
              component={Link} 
              href="/entrada" 
              sx={navItemStyle('/entrada')} 
              startIcon={<AddCircleOutlineIcon sx={{ fontSize: '1.2rem' }} />}
            >
              Cadastrar
            </Button>

            <Button 
              component={Link} 
              href="/suporte" 
              sx={navItemStyle('/suporte')} 
              startIcon={<BuildIcon sx={{ fontSize: '1.2rem' }} />}
            >
              Suporte
            </Button>

          </Box>
        </Box>

        {/* USER INFO */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          
          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography 
              variant="subtitle2" 
              sx={{ fontWeight: 700, color: darkGray, lineHeight: 1.2, fontSize: '0.9rem' }}
            >
              {user.nome}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ color: marconBlue, fontWeight: 600, fontSize: '0.75rem' }}
            >
              {user.perfil}
            </Typography>
          </Box>

          <Avatar 
            sx={{ 
              bgcolor: `${marconBlue}15`, 
              color: marconBlue, 
              fontWeight: 800, 
              width: 42, 
              height: 42, 
              borderRadius: 2.5 
            }}
          >
            {user.nome.charAt(0).toUpperCase()}
          </Avatar>

          <Divider orientation="vertical" flexItem sx={{ height: 24, mx: 1, borderColor: '#E2E8F0' }} />

          <Tooltip title="Sair do Sistema" arrow placement="bottom">
            <IconButton 
              onClick={handleLogout} 
              sx={{ 
                color: '#94A3B8', 
                bgcolor: '#F8FAFC', 
                borderRadius: 2.5, 
                p: 1.2,
                '&:hover': { 
                  color: '#DC2626', 
                  bgcolor: '#FEF2F2',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s'
              }}
            >
              <LogoutIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

        </Box>

      </Toolbar>
    </AppBar>
  );
}