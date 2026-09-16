"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '../app/lib/api'; 
import { 
  Container, Box, Typography, Paper, Accordion, AccordionSummary, 
  AccordionDetails, Chip, Button, List, ListItem, ListItemText,
  Skeleton, Backdrop, CircularProgress, TextField, InputAdornment, Autocomplete,
  Avatar, IconButton, Tooltip, Fade, MenuItem, Select, FormControl, InputLabel,
  Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, Fab
} from '@mui/material';

import Swal from 'sweetalert2';
// Ícones
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BuildIcon from '@mui/icons-material/Build';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import HistoryIcon from '@mui/icons-material/History';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SendIcon from '@mui/icons-material/Send';

// Tipagens
interface ResumoItem { descricao: string; total_unidades: number; disponiveis: number; }
interface MovimentoItem { ferramenta: string; tipo: string; usuario: string; data: string; }
interface AlertaItem { descricao: string; disponiveis: number; }
interface ColaboradorItem { cracha: string; nome: string; oficina?: string; }

export default function Dashboard() {
  const router = useRouter();

  // Estados dos Dados
  const [resumo, setResumo] = useState<ResumoItem[]>([]);
  const [unidades, setUnidades] = useState<{ [key: string]: any[] }>({});
  const [movimentos, setMovimentos] = useState<MovimentoItem[]>([]);
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorItem[]>([]);
  
  // Estados de Interface e Filtros
  const [loading, setLoading] = useState(true);
  const [proc, setProc] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('Todas');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  // 📦 Estados da Entrega em Massa
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [oficinaSelecionada, setOficinaSelecionada] = useState('Todas');
  const [crachaSelecionado, setCrachaSelecionado] = useState('');

  const marconBlue = "#00509d";
  const darkGray = "#1A1C1E";

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      const [resResumo, resMovs, resAlertas, resColab] = await Promise.all([
        fetchWithAuth('http://localhost:4000/api/ferramentas/resumo'),
        fetchWithAuth('http://localhost:4000/api/movimentacoes/recentes'),
        fetchWithAuth('http://localhost:4000/api/ferramentas/alertas'),
        fetchWithAuth('http://localhost:4000/api/colaboradores') // Busca os funcionários pro modal
      ]);

      setResumo(Array.isArray(resResumo) ? resResumo : []);
      setMovimentos(Array.isArray(resMovs) ? resMovs : []);
      setAlertas(Array.isArray(resAlertas) ? resAlertas : []);
      setColaboradores(Array.isArray(resColab) ? resColab : []);
    } catch (e: any) {
      console.error("Erro ao carregar dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDashboard(); }, []);

  const expandir = async (desc: string) => {
    if (unidades[desc]) return;
    setProc(true);
    try {
      const data = await fetchWithAuth(`http://localhost:4000/api/ferramentas/unidades?descricao=${encodeURIComponent(desc)}`);
      setUnidades(prev => ({ ...prev, [desc]: data }));
    } catch (e: any) {
      console.error("Erro ao expandir unidades:", e);
    } finally {
      setProc(false);
    }
  };

  // 🛒 Função para selecionar/deselecionar as ferramentas nas caixinhas
  const handleToggleFerramenta = (codigo: string) => {
    setSelecionadas(prev => 
      prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]
    );
  };

  // 🚀 Dispara a entrega para o Back-end
  const handleConfirmarEntrega = async () => {
    if (!crachaSelecionado) {
      alert("Por favor, selecione um colaborador.");
      return;
    }

    // Extrai o ID do usuário (Lendo do LocalStorage e Token)
    let userId = 1;
    try {
      const userStr = localStorage.getItem('marcon_user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const idFromStorage = userObj?.id || userObj?.user?.id || userObj?.usuario_id;

      let idFromToken = null;
      const token = localStorage.getItem('marcon_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        idFromToken = payload?.id || payload?.userId || payload?.usuario_id || payload?.user?.id;
      }

      userId = Number(idFromStorage || idFromToken) || 1;
    } catch (e) {
      console.warn("Aviso: Não foi possível extrair o ID do usuário.");
    }

    setProc(true);
    try {
      await fetchWithAuth('http://localhost:4000/api/movimentacoes/entrega', {
        method: 'POST',
        body: JSON.stringify({ 
          ferramentas: selecionadas, 
          colaborador_cracha: String(crachaSelecionado).trim(),
          almoxarife_id: userId,
          almoxarife_retirada_id: userId
        })
      });

      // Fecha o modal e desativa o blur ANTES de mostrar o alerta
      setProc(false);
      setOpenModal(false);

      // Usamos o SweetAlert diretamente aqui com 'await' para esperar o clique no botão "OK"
      await Swal.fire({
        title: 'Sucesso!',
        text: `${selecionadas.length} ferramenta(s) entregues.`,
        icon: 'success',
        confirmButtonColor: '#00509d'
      });

      setSelecionadas([]);
      setCrachaSelecionado('');
      
      window.location.reload(); 
    } catch (err: unknown) {
      setProc(false); // Remove o loading em caso de erro também
      console.error("Erro na entrega:", err);
      const message = err instanceof Error ? err.message : undefined;
      if (message?.includes('fk_mov_almoxarife')) {
        alert("Sessão corrompida: Seu usuário logado não existe mais no banco de dados. Por favor, faça logout e login novamente para sincronizar.");
      } else {
        alert("Erro ao realizar a entrega: " + (message || "Falha interna do servidor."));
      }
    }
  };

  // Extrair filtros dinâmicos
  const marcasDisponiveis = useMemo(() => {
    const marcasConhecidas = ['Makita', 'Dewalt', 'Belzer', 'Bosch', 'Gedore', 'Tramontina', 'Vonder', 'Stanley', 'Starrett'];
    const marcasEncontradas = new Set<string>();
    resumo.forEach(item => {
      item.descricao.split(' ').forEach(p => {
        if (marcasConhecidas.includes(p)) marcasEncontradas.add(p);
      });
    });
    return ['Todas', ...Array.from(marcasEncontradas)];
  }, [resumo]);

  // Pegar lista de oficinas únicas para o Modal
  const oficinasDisponiveis = useMemo(() => {
    const setOficinas = new Set(colaboradores.map(c => c.oficina || 'Geral'));
    return ['Todas', ...Array.from(setOficinas)];
  }, [colaboradores]);

  const filtrados = resumo.filter((i: ResumoItem) => {
    const matchBusca = i.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchMarca = filtroMarca === 'Todas' || i.descricao.includes(filtroMarca);
    const matchStatus = filtroStatus === 'Todos' ? true : filtroStatus === 'Disponíveis' ? i.disponiveis > 0 : i.disponiveis === 0;
    return matchBusca && matchMarca && matchStatus;
  });

  return (
    <Box sx={{ bgcolor: "#FAFAFA", minHeight: '100vh', py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Container maxWidth="lg" sx={{ pb: selecionadas.length > 0 ? 10 : 0 }}>
        
        {/* HEADER */}
        <Fade in={true} timeout={600}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 900, color: darkGray, letterSpacing: '-2px', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: marconBlue, color: 'white', width: 48, height: 48 }}>
                  <DashboardIcon />
                </Avatar>
                Visão <span style={{ color: marconBlue }}>Geral</span>
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#64748B', fontWeight: 500, mt: 1 }}>
                Acompanhe o fluxo e entregue ferramentas
              </Typography>
            </Box>
          </Box>
        </Fade>

        <Fade in={true} timeout={800}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            
            {/* COLUNA ESQUERDA: LISTA */}
            <Box sx={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              <Paper elevation={0} sx={{ p: 2, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#F8FAFC', borderRadius: 3, px: 2, border: '1px solid #E2E8F0' }}>
                    <TextField fullWidth placeholder="Buscar ferramenta..." variant="standard" value={busca} onChange={(e) => setBusca(e.target.value)} autoComplete='off' slotProps={{ input: { disableUnderline: true, startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: marconBlue, mr: 1 }} /></InputAdornment>), sx: { py: 1.5, fontSize: '1.1rem', fontWeight: 500, color: darkGray } } }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}><FilterAltIcon fontSize="small" /> Filtros:</Typography>
                  <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel sx={{ fontWeight: 700 }}>Marca</InputLabel><Select value={filtroMarca} label="Marca" onChange={(e) => setFiltroMarca(e.target.value)} sx={{ borderRadius: 2, fontWeight: 700, bgcolor: 'white' }}>{marcasDisponiveis.map(m => <MenuItem key={m} value={m} sx={{ fontWeight: 600 }}>{m}</MenuItem>)}</Select></FormControl>
                  <FormControl size="small" sx={{ minWidth: 160 }}><InputLabel sx={{ fontWeight: 700 }}>Disponibilidade</InputLabel><Select value={filtroStatus} label="Disponibilidade" onChange={(e) => setFiltroStatus(e.target.value)} sx={{ borderRadius: 2, fontWeight: 700, bgcolor: 'white' }}><MenuItem value="Todos" sx={{ fontWeight: 600 }}>Todos</MenuItem><MenuItem value="Disponíveis" sx={{ fontWeight: 600 }}>Com Estoque</MenuItem><MenuItem value="Em Falta" sx={{ fontWeight: 600 }}>Em Falta</MenuItem></Select></FormControl>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                <Box sx={{ maxHeight: '650px', overflowY: 'auto' }}>
                  {loading ? (
                    <Box sx={{ p: 3 }}><Skeleton variant="rounded" height={80} sx={{ mb: 2, borderRadius: 3 }} /><Skeleton variant="rounded" height={80} sx={{ borderRadius: 3 }} /></Box>
                  ) : (
                    filtrados.length > 0 ? filtrados.map((item: ResumoItem, index: number) => (
                      <Accordion key={item.descricao} onChange={(_, exp) => exp && expandir(item.descricao)} disableGutters sx={{ boxShadow: 'none', '&:before': { display: 'none' }, borderBottom: index !== filtrados.length - 1 ? '1px solid #F1F5F9' : 'none', bgcolor: 'white' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94A3B8' }} />} sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Avatar variant="rounded" sx={{ bgcolor: `${marconBlue}1A`, color: marconBlue, fontWeight: 700, borderRadius: 2, width: 48, height: 48 }}><BuildIcon /></Avatar>
                              <Box>
                                  <Typography sx={{ fontWeight: 800, color: darkGray, fontSize: '1.1rem' }}>{item.descricao}</Typography>
                                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mt: 0.5 }}>Total no inventário: <b>{item.total_unidades}</b></Typography>
                              </Box>
                            </Box>
                            <Chip label={`${item.disponiveis} Disponíveis`} sx={{ bgcolor: item.disponiveis > 0 ? '#F0FDF4' : '#FEF2F2', color: item.disponiveis > 0 ? '#16A34A' : '#DC2626', fontWeight: 800, borderRadius: 2, px: 1, py: 2 }} />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, bgcolor: '#FAFAFA', borderTop: '1px solid #F1F5F9' }}>
                          <List dense disablePadding>
                            {unidades[item.descricao]?.map((uni: any, idx: number) => {
                              const isAvailable = uni.estoque_disponivel > 0 && !uni.em_manutencao;
                              return (
                                <ListItem key={uni.codigo} sx={{ py: 2, px: 2, borderBottom: idx !== unidades[item.descricao].length - 1 ? '1px dashed #E2E8F0' : 'none' }}>
                                  
                                  {/* 🎯 CAIXA DE SELEÇÃO */}
                                  <Checkbox 
                                    checked={selecionadas.includes(uni.codigo)}
                                    onChange={() => handleToggleFerramenta(uni.codigo)}
                                    disabled={!isAvailable}
                                    sx={{ color: '#CBD5E1', '&.Mui-checked': { color: marconBlue } }}
                                  />

                                  <ListItemText 
                                    disableTypography
                                    primary={<Typography sx={{ fontWeight: 800, fontSize: '1rem', color: isAvailable ? darkGray : '#94A3B8' }}>{uni.codigo}</Typography>}
                                    secondary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isAvailable ? '#16A34A' : (uni.em_manutencao ? '#DC2626' : '#F59E0B') }} />
                                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>{uni.status}</Typography>
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              );
                            })}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    )) : (
                      <Box sx={{ p: 8, textAlign: 'center' }}><ErrorOutlineIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} /><Typography sx={{ color: '#94A3B8', fontWeight: 500 }}>Nenhuma ferramenta encontrada com esses filtros.</Typography></Box>
                    )
                  )}
                </Box>
              </Paper>
            </Box>

            {/* COLUNA DIREITA */}
            <Box sx={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {alertas.length > 0 && (
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: '#FFF1F2', border: `1px solid #FECACA`, display: 'flex', flexDirection: 'column', maxHeight: 320 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 1.5 }}><ErrorOutlineIcon /> Itens Críticos ({alertas.length})</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto', pr: 1 }}>
                    {alertas.map((a: AlertaItem, i) => (
                      <Box key={i} sx={{ p: 1.5, borderRadius: 3, bgcolor: 'white', border: '1px solid #FEE2E2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: darkGray, fontSize: '0.85rem' }}>{a.descricao}</Typography>
                        <Chip label={a.disponiveis} size="small" sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 800, borderRadius: 1.5 }} />
                      </Box>
                    ))}
                  </Box>
                </Paper>
              )}

              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white', display: 'flex', flexDirection: 'column', flex: 1, maxHeight: 400 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5, color: darkGray }}><HistoryIcon sx={{ color: marconBlue }} /> Últimas Ações</Typography>
                  </Box>
                  <Box sx={{ overflowY: 'auto', pr: 1 }}>
                    <List dense disablePadding>
                        {movimentos.length > 0 ? movimentos.map((mov: MovimentoItem, i) => (
                          <ListItem key={i} sx={{ px: 0, py: 1.5, borderBottom: i !== movimentos.length - 1 ? '1px dashed #F1F5F9' : 'none' }}>
                            <Avatar sx={{ bgcolor: mov.tipo.includes('Saída') ? '#FEF2F2' : '#F0FDF4', color: mov.tipo.includes('Saída') ? '#DC2626' : '#16A34A', width: 32, height: 32, mr: 2 }}>
                              <ExpandMoreIcon fontSize="small" sx={{ transform: mov.tipo.includes('Saída') ? 'none' : 'rotate(180deg)' }} />
                            </Avatar>
                            <ListItemText 
                              disableTypography primary={<Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: darkGray }}>{mov.ferramenta}</Typography>}
                              secondary={<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, alignItems: 'center' }}><Typography sx={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>{mov.usuario}</Typography><Typography sx={{ fontSize: '0.7rem', color: '#94A3B8' }}>{mov.data}</Typography></Box>}
                            />
                          </ListItem>
                        )) : (<Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center' }}>Sem movimentações recentes.</Typography>)}
                    </List>
                  </Box>
              </Paper>
            </Box>

          </Box>
        </Fade>
      </Container>

      {/* 🚀 BOTÃO FLUTUANTE DE ENTREGA (Aparece ao selecionar itens) */}
      <Fade in={selecionadas.length > 0}>
        <Fab 
          variant="extended" 
          sx={{ position: 'fixed', bottom: 32, right: 32, bgcolor: marconBlue, color: 'white', fontWeight: 900, px: 4, py: 3, boxShadow: '0 10px 25px rgba(0, 80, 157, 0.4)', '&:hover': { bgcolor: '#003a70' } }}
          onClick={() => setOpenModal(true)}
        >
          <SendIcon sx={{ mr: 1.5 }} />
          Entregar {selecionadas.length} Ferramenta{selecionadas.length > 1 ? 's' : ''}
        </Fab>
      </Fade>

      {/* 🟢 MODAL DE SELEÇÃO DE OFICINA E FUNCIONÁRIO */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        maxWidth="sm" 
        fullWidth 
        disableRestoreFocus // <-- Previne o erro do aria-hidden quando o botão Fab sumir
        slotProps={{ 
          backdrop: { sx: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(26, 28, 30, 0.5)' } },
          paper: { sx: { borderRadius: 5, p: 2, border: '1px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' } } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: darkGray, pb: 2, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SendIcon sx={{ color: marconBlue }} /> Entregar Ferramentas
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography sx={{ color: '#64748B', mb: 3, fontWeight: 500 }}>
            Você está entregando <b>{selecionadas.length}</b> itens. Selecione o destino:
          </Typography>

          {/* Filtro de Oficina */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ fontWeight: 700 }}>1. Filtrar por Oficina (Opcional)</InputLabel>
            <Select 
              value={oficinaSelecionada} 
              label="1. Filtrar por Oficina (Opcional)" 
              onChange={(e) => { setOficinaSelecionada(e.target.value); setCrachaSelecionado(''); }}
              sx={{ borderRadius: 3, fontWeight: 700 }}
            >
              {oficinasDisponiveis.map(o => <MenuItem key={o} value={o} sx={{ fontWeight: 600 }}>{o}</MenuItem>)}
            </Select>
          </FormControl>

          {/* Seleção do Funcionário */}
          <Autocomplete
            fullWidth
            options={colaboradores.filter(c => oficinaSelecionada === 'Todas' || (c.oficina || 'Geral') === oficinaSelecionada)}
            getOptionLabel={(option) => `${option.nome} (${option.cracha}) - ${option.oficina || 'Geral'}`}
            value={colaboradores.find(c => c.cracha === crachaSelecionado) || null}
            onChange={(event, newValue) => {
              setCrachaSelecionado(newValue ? newValue.cracha : '');
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="2. Selecione ou busque o colaborador" 
                placeholder="Digite o nome, crachá ou oficina..."
              />
            )}
            sx={{ mt: 1 }}
          />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ color: '#64748B', fontWeight: 800, px: 3, py: 1.5, borderRadius: 3, textTransform: 'none', '&:hover': { bgcolor: '#F1F5F9' } }}>Cancelar</Button>
          <Button 
            onClick={handleConfirmarEntrega} 
            disabled={!crachaSelecionado || proc}
            variant="contained" 
            sx={{ bgcolor: marconBlue, fontWeight: 800, borderRadius: 3, px: 4, py: 1.5, textTransform: 'none', boxShadow: `0 8px 20px ${marconBlue}40`, '&:hover': { bgcolor: '#003a70', transform: 'translateY(-2px)' }, transition: 'all 0.2s' }}
          >
            {proc ? "Processando..." : "Confirmar Entrega"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FEEDBACK DE LOADING */}
      <Backdrop open={proc} sx={{ zIndex: 9999, color: marconBlue, backdropFilter: 'blur(4px)' }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}