"use client";

import React, { useState } from 'react';
import { 
  Box, Container, Typography, TextField, Button, 
  InputAdornment, IconButton, Checkbox, FormControlLabel, Fade, Alert, CircularProgress
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import Cookies from 'js-cookie'; 

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [cracha, setCracha] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const marconBlue = "#00509d";
  const darkGray = "#1A1C1E";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // 📡 Enviando para o seu Back-end no Node (Porta 4000)
      const response = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cracha, senha })
      });

      const data = await response.json();

      if (data.success) {
        // 🍪 O Pulo do Gato: Salva o cookie na raiz '/' para o Middleware ver na hora
        Cookies.set('marcon_token', data.token, { expires: 1, path: '/' }); 

        // 💾 Salva os dados para a Topbar exibir seu nome depois
        localStorage.setItem('marcon_user', JSON.stringify(data.user));
        
        console.log("✅ Login realizado com sucesso! Entrando...");

        // 🚀 A solução para o Looping: Forçamos o navegador a recarregar a página
        // Isso faz o Middleware.ts ler o Cookie novo imediatamente.
        window.location.href = '/'; 
      } else {
        setErro(data.message || 'Crachá ou senha incorretos.');
      }
    } catch (err) {
      setErro('Erro de Conexão: Verifique se o servidor da API está ligado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'white', overflow: 'hidden' }}>
      
      {/* LADO ESQUERDO: FORMULÁRIO */}
      <Box sx={{ 
        flex: { xs: 1, md: 0.8, lg: 0.6 }, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 2, 
        bgcolor: 'white', 
        boxShadow: '10px 0 40px rgba(0,0,0,0.05)' 
      }}>
        <Fade in={true} timeout={1000}>
          <Container maxWidth="xs">
            <Box sx={{ textAlign: 'center', mb: 5 }}>

  <Box
    component="img"
    src="/logo.png"
    alt="Logo Marcon"
    sx={{
      height: 80,
      objectFit: "contain",
      mb: 2,
      filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.15))"
    }}
  />

  <Typography
    variant="body1"
    sx={{
      color: '#64748B',
      fontWeight: 500
    }}
  >
    Gestão de Ativos Industrial
  </Typography>

</Box>

            {erro && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{erro}</Alert>}

            <form onSubmit={handleLogin}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Crachá"
                  variant="outlined"
                  value={cracha}
                  onChange={(e) => setCracha(e.target.value)}
                  placeholder="Seu número de registro"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon sx={{ color: marconBlue }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 3 }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: marconBlue }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 3 }
                    }
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel 
                    control={<Checkbox sx={{ color: marconBlue, '&.Mui-checked': { color: marconBlue } }} />} 
                    label={<Typography variant="body2">Lembrar acesso</Typography>} 
                  />
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ 
                    py: 2, borderRadius: 3, fontWeight: 800, fontSize: '1rem', bgcolor: marconBlue, textTransform: 'none',
                    boxShadow: `0 8px 20px ${marconBlue}40`,
                    '&:hover': { bgcolor: '#003a70', transform: 'translateY(-2px)' },
                    transition: '0.3s'
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Entrar no Sistema'}
                </Button>
              </Box>
            </form>

            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 8, color: '#94A3B8' }}>
              © 2026 Marcon Indústria - Depto de Manutenção
            </Typography>
          </Container>
        </Fade>
      </Box>

      {/* LADO DIREITO: DESIGN */}
      <Box sx={{ 
        flex: { xs: 0, md: 1.2, lg: 1.4 }, 
        position: 'relative', 
        display: { xs: 'none', md: 'block' }, 
        bgcolor: darkGray 
      }}>
        <Box sx={{ 
          position: 'absolute', 
          inset: 0, 
          zIndex: 0, 
          backgroundImage: 'url("/login.png")', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }} />

        <Box sx={{ 
          position: 'absolute', 
          inset: 0, 
          bgcolor: marconBlue, 
          clipPath: 'polygon(0% 0%, 35% 0%, 15% 100%, 0% 100%)', 
          zIndex: 1, 
          opacity: 0.35, 
          mixBlendMode: 'multiply' 
        }} />

        <Box sx={{ 
          position: 'absolute', 
          bottom: 80, 
          right: 60, 
          zIndex: 3, 
          textAlign: 'right', 
          color: 'white', 
          textShadow: '0 4px 15px rgba(0,0,0,0.4)' 
        }}>
          <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 0.8, mb: 1 }}>QUALIDADE</Typography>
          <Typography variant="h4" sx={{ fontWeight: 300, letterSpacing: 8 }}>EM CADA DETALHE</Typography>
          <Box sx={{ width: 80, height: 6, bgcolor: 'white', ml: 'auto', mt: 2 }} />
        </Box>
      </Box>
    </Box>
  );
}