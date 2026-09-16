"use client";

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/api'; // Usar o wrapper de fetch autenticado
import { 
  Container, Box, Typography, Paper, Button, TextField, FormControl,
  InputLabel, OutlinedInput,
  Avatar, Divider, List, ListItem, ListItemText, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem,
  Fade, CircularProgress, Backdrop, InputAdornment, IconButton
} from '@mui/material';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import BuildIcon from '@mui/icons-material/Build';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import TimerIcon from '@mui/icons-material/Timer';
import GppGoodIcon from '@mui/icons-material/GppGood';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

// Tipagem para os itens de pendência
interface PendenciaItem {
  id: number;
  descricao: string;
  ferramenta_codigo: string;
  colaborador_cracha: string;
  funcionario: string;
  data_retirada: string;
}

export default function DevolucaoProfissional() {
  const [pendencias, setPendencias] = useState<PendenciaItem[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PendenciaItem | null>(null);
  const [condicao, setCondicao] = useState('PERFEITO ESTADO');
  const [obs, setObs] = useState('');
  const [processando, setProcessando] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<{ ferramenta: any, historico: any[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const marconBlue = "#00509d";
  const darkGray = "#1A1C1E";

  const carregarPendencias = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('http://localhost:4000/api/movimentacoes/pendencias');
      if (Array.isArray(data)) {
        setPendencias(data);
      }
    } catch (error) {
      console.error("Erro ao carregar pendências:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarPendencias(); }, []);

  const handleReceber = async () => {
    setProcessando(true);
    try {
      await fetchWithAuth('http://localhost:4000/api/movimentacoes/devolucao', {
        method: 'POST',
        body: JSON.stringify({ movimentacao_id: selected?.id, condicao, observacao: obs })
      });
      setOpen(false);
      setObs('');
      await carregarPendencias(); // Recarrega a lista após o sucesso
    } catch (error) {
      console.error("Erro ao registrar devolução:", error);
    } finally {
      setProcessando(false);
    }
  };

  const handleViewHistory = async (codigo: string) => {
    setHistoryLoading(true);
    setHistoryOpen(true);
    setHistoryData(null);
    try {
      const data = await fetchWithAuth(`http://localhost:4000/api/ferramentas/historico/${codigo}`);
      setHistoryData(data);
    } catch (error) {
      console.error("Erro ao carregar histórico da ferramenta:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filtra a lista em tempo real por ferramenta ou crachá
  const filtradas = pendencias.filter((p: PendenciaItem) => {
    const buscaMatch = 
      p.descricao.toLowerCase().includes(busca.toLowerCase()) || 
      p.ferramenta_codigo.includes(busca) ||
      p.colaborador_cracha.includes(busca);

    const activeFilterMatch = (() => {
      if (!activeFilter) return true;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataRetirada = new Date(p.data_retirada);
      dataRetirada.setHours(0, 0, 0, 0);

      switch (activeFilter) {
        case 'HOJE':
          return dataRetirada.getTime() === hoje.getTime();
        case 'ANTIGOS':
          const umaSemanaAtras = new Date(hoje);
          umaSemanaAtras.setDate(hoje.getDate() - 7);
          return dataRetirada < umaSemanaAtras;
        default:
          return true;
      }
    })();

    const dateMatch = (() => {
      if (!startDate && !endDate) return true;
      const itemDate = new Date(p.data_retirada);
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (itemDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        if (itemDate > end) return false;
      }
      return true;
    })();

    return buscaMatch && activeFilterMatch && dateMatch;
  });

  // Filtra o histórico para mostrar apenas a cadeia atual de repasses (desde que saiu do almoxarifado)
  const historicoCicloAtual = historyData?.historico ? (() => {
    const ciclo = [];
    for (const mov of historyData.historico) {
        if (mov.condicao_devolucao) break; // Uma devolução real encerra o ciclo
        ciclo.push(mov);
    }
    return ciclo;
  })() : [];

  return (
    <Box sx={{ bgcolor: '#FAFAFA', minHeight: '100vh', py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Container maxWidth="md">
        
        {/* HEADER DE GESTÃO */}
        <Fade in={true} timeout={600}>
          <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ bgcolor: marconBlue, color: 'white', width: 56, height: 56, borderRadius: 3, boxShadow: '0 4px 15px rgba(0, 80, 157, 0.3)' }}>
                <AssignmentReturnIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, color: darkGray, letterSpacing: '-2px' }}>
                  Recebimento de <span style={{ color: marconBlue }}>Ativos</span>
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#64748B', fontWeight: 500, mt: 0.5 }}>
                  {pendencias.length} ITENS EM CAMPO NO MOMENTO
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>

        <Fade in={true} timeout={800}>
          <Box>
            {/* BARRA DE BUSCA INTELIGENTE */}
            <Paper elevation={0} sx={{ 
                p: 2, mb: 4, borderRadius: 4, border: '1px solid #E2E8F0', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center' 
            }}>
              <TextField 
                fullWidth 
                placeholder="Bipe o patrimônio ou busque por nome..."
                variant="standard"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                slotProps={{
                    input: {
                        disableUnderline: true,
                        startAdornment: <SearchIcon sx={{ color: marconBlue, mx: 2 }} />,
                        sx: { py: 1, fontSize: '1.1rem', fontWeight: 500, color: darkGray }
                    }
                }}
              />
            </Paper>

            {/* CAIXA DE FILTROS AVANÇADOS */}
            <Paper elevation={0} sx={{ 
                p: 2.5, mb: 4, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3,
                border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', bgcolor: 'white' 
            }}>
                {/* Lado Esquerdo: Filtros de Prioridade */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 800, color: '#64748B', mr: 1, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prioridade:</Typography>
                    <Chip 
                        label="Todos" 
                        onClick={() => setActiveFilter(null)}
                        variant={!activeFilter ? 'filled' : 'outlined'}
                        sx={{ 
                            fontWeight: 800, cursor: 'pointer', borderRadius: 2, px: 1,
                            ...(!activeFilter && { bgcolor: marconBlue, color: 'white', border: 'none' })
                        }}
                    />
                    <Chip 
                        label="Retirados Hoje" 
                        onClick={() => setActiveFilter('HOJE')}
                        variant={activeFilter === 'HOJE' ? 'filled' : 'outlined'}
                        sx={{ 
                            fontWeight: 800, cursor: 'pointer', borderRadius: 2, px: 1,
                            ...(activeFilter === 'HOJE' && { bgcolor: marconBlue, color: 'white', border: 'none' })
                        }}
                    />
                    <Chip 
                        label="Mais Antigos" 
                        onClick={() => setActiveFilter('ANTIGOS')}
                        variant={activeFilter === 'ANTIGOS' ? 'filled' : 'outlined'}
                        sx={{ 
                            fontWeight: 800, cursor: 'pointer', borderRadius: 2, px: 1,
                            ...(activeFilter === 'ANTIGOS' && { bgcolor: '#DC2626', color: 'white', border: 'none' })
                        }}
                    />
                </Box>

                {/* Lado Direito: Filtros por Data */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 800, color: '#64748B', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Período:</Typography>
                    <FormControl size="small" variant="outlined" sx={{ bgcolor: '#F8FAFC', borderRadius: 2 }}>
                        <InputLabel shrink htmlFor="start-date" sx={{ px: 1, fontWeight: 700, color: '#94A3B8' }}>De</InputLabel>
                        <OutlinedInput
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            notched
                            sx={{ borderRadius: 2, '& fieldset': { borderColor: '#E2E8F0' }, fontWeight: 600, color: darkGray }}
                        />
                    </FormControl>
                    <Typography sx={{ color: '#CBD5E1', fontWeight: 800 }}>-</Typography>
                    <FormControl size="small" variant="outlined" sx={{ bgcolor: '#F8FAFC', borderRadius: 2 }}>
                        <InputLabel shrink htmlFor="end-date" sx={{ px: 1, fontWeight: 700, color: '#94A3B8' }}>Até</InputLabel>
                        <OutlinedInput
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            notched
                            sx={{ borderRadius: 2, '& fieldset': { borderColor: '#E2E8F0' }, fontWeight: 600, color: darkGray }}
                        />
                    </FormControl>
                </Box>
            </Paper>

            {/* LISTA DE PENDÊNCIAS COM ROLAGEM */}
            <Paper elevation={0} sx={{ 
                borderRadius: 4, overflow: 'hidden', border: '1px solid #E2E8F0', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.03)', bgcolor: 'white' 
            }}>
              <Box sx={{ maxHeight: '600px', overflowY: 'auto' }}>
                {loading ? (
                    <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: marconBlue }} size={50} /></Box>
                ) : filtradas.length > 0 ? (
                    <List disablePadding>
                    {filtradas.map((item: any, idx: number) => (
                        <Fade in={true} key={item.id} timeout={400 + (idx * 100)}>
                            <ListItem sx={{
                                borderBottom: idx !== filtradas.length - 1 ? '1px dashed #E2E8F0' : 'none', py: 3, px: 4,
                                '&:hover': { bgcolor: '#F8FAFC' },
                                transition: '0.2s',
                                display: 'flex', alignItems: 'center'
                            }}>
                                <Avatar variant="rounded" sx={{ bgcolor: `${marconBlue}1A`, color: marconBlue, width: 56, height: 56, mr: 3, borderRadius: 3 }}>
                                    <BuildIcon />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: darkGray }}>{item.descricao}</Typography>
                                        <Chip label={item.ferramenta_codigo} size="small" sx={{ fontWeight: 800, bgcolor: '#F1F5F9', color: '#64748B', borderRadius: 1.5 }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                                            Responsável: <strong style={{ color: darkGray }}>{item.funcionario || item.colaborador_cracha}</strong>
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: marconBlue }}>
                                            <TimerIcon sx={{ fontSize: 16 }} />
                                            <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                                Saída: {new Date(item.data_retirada).toLocaleString('pt-BR')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Tooltip title="Ver histórico do item">
                                        <IconButton onClick={() => handleViewHistory(item.ferramenta_codigo)}>
                                            <HistoryIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Button 
                                        variant="contained" 
                                        onClick={() => { setSelected(item); setOpen(true); }}
                                        sx={{ 
                                            bgcolor: darkGray, color: 'white', fontWeight: 800, px: 4, py: 1.5, borderRadius: 3,
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textTransform: 'none', fontSize: '1rem',
                                            '&:hover': { bgcolor: marconBlue, transform: 'translateY(-2px)' },
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        Receber
                                    </Button>
                                </Box>
                            </ListItem>
                        </Fade>
                    ))}
                    </List>
                ) : (
                    <Box sx={{ p: 10, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <AssignmentReturnIcon sx={{ fontSize: 60, color: '#CBD5E1', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 700 }}>
                            {busca ? "Nenhum registro encontrado." : "Nenhuma ferramenta pendente no momento!"}
                        </Typography>
                    </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Fade>
      </Container>

      {/* MODAL DE CHECK-IN (AVALIAÇÃO) */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        fullWidth maxWidth="sm" 
        slotProps={{
          backdrop: { sx: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(26, 28, 30, 0.5)' } },
          paper: { sx: { borderRadius: 6, p: 1, border: '1px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.8rem', textAlign: 'center', color: darkGray, pb: 1, pt: 3 }}>
          <AssignmentReturnIcon sx={{ color: marconBlue, fontSize: '2.5rem', mb: 1, display: 'block', mx: 'auto' }} />
            Check-in de Ativo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500, mb: 0.5 }}>Confirmar recebimento de:</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: marconBlue }}>{selected?.descricao}</Typography>
          </Box>
          
          <Divider sx={{ mb: 4, borderStyle: 'dashed' }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: darkGray }}>Avaliação do Estado</Typography>
          <Select 
            fullWidth 
            value={condicao} 
            onChange={(e) => setCondicao(e.target.value as string)} 
            sx={{ borderRadius: 3, mb: 4, bgcolor: '#FAFAFA', fontWeight: 700 }}
          >
            <MenuItem value="PERFEITO ESTADO">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <GppGoodIcon sx={{ color: '#16A34A' }} /> Perfeito Estado
                </Box>
            </MenuItem>
            <MenuItem value="QUEBRADA">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <ReportProblemIcon sx={{ color: '#DC2626' }} /> Quebrada / Danificada
                </Box>
            </MenuItem>
            <MenuItem value="DESGASTE NATURAL">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <BuildIcon sx={{ color: '#F59E0B' }} /> Desgaste Natural
                </Box>
            </MenuItem>
          </Select>

          <TextField 
            fullWidth 
            label="Notas de Manutenção (Opcional)" 
            placeholder="Algum detalhe importante sobre o uso?"
            multiline rows={3} 
            value={obs} 
            onChange={(e) => setObs(e.target.value)}
            slotProps={{ input: { sx: { borderRadius: 3, bgcolor: '#FAFAFA' } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2, pt: 1, pb: 4 }}>
          <Button onClick={() => setOpen(false)} sx={{ fontWeight: 800, color: '#64748B', px: 4, py: 1.5, borderRadius: 3, textTransform: 'none', fontSize: '1rem', '&:hover': { bgcolor: '#F1F5F9' } }}>Cancelar</Button>
          <Button 
            onClick={handleReceber} 
            variant="contained" 
            sx={{ 
                bgcolor: marconBlue, fontWeight: 900, px: 5, py: 1.5, borderRadius: 3,
                boxShadow: `0 8px 20px ${marconBlue}40`, textTransform: 'none', fontSize: '1rem',
                '&:hover': { bgcolor: '#003a70', transform: 'translateY(-2px)' },
                transition: 'all 0.3s'
            }}
          >
            Confirmar Retorno
          </Button>
        </DialogActions>
      </Dialog>

      <Backdrop open={processando} sx={{ zIndex: 9999, color: '#fff', backdropFilter: 'blur(8px)' }}>
        <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: marconBlue }} thickness={5} size={60} />
            <Typography sx={{ mt: 3, fontWeight: 800, color: 'white' }}>Atualizando inventário...</Typography>
        </Box>
      </Backdrop>

      {/* MODAL DE HISTÓRICO */}
      <Dialog 
        open={historyOpen} 
        onClose={() => setHistoryOpen(false)} 
        fullWidth maxWidth="md" 
        slotProps={{
          backdrop: { sx: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(26, 28, 30, 0.5)' } },
          paper: { sx: { borderRadius: 5, border: '1px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: darkGray, p: 3, pb: 1 }}>
            <HistoryIcon sx={{ color: marconBlue, mr: 1, verticalAlign: 'middle' }} />
            Cadeia de Repasses da Ferramenta
            {historyData?.ferramenta && (
                <Typography variant="h6" component="span" sx={{ display: 'block', color: marconBlue, fontWeight: 700 }}>
                    {historyData.ferramenta.descricao} ({historyData.ferramenta.codigo})
                </Typography>
            )}
            <Typography variant="caption" component="span" sx={{ display: 'block', color: '#64748B', fontWeight: 600 }}>
                Mostrando apenas o ciclo atual (desde a última saída do almoxarifado)
            </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
            {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                    <CircularProgress sx={{ color: marconBlue }} />
                </Box>
            ) : historyData && historicoCicloAtual.length > 0 ? (
                <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 1, border: '1px solid #E2E8F0', borderRadius: 4, bgcolor: 'white' }}>
                    <List dense sx={{ p: 0, overflow: 'hidden' }}>
                        {historicoCicloAtual.map((mov: any, idx: number, arr: any[]) => (
                            <ListItem key={mov.id} sx={{ 
                                py: 2.5, px: 3, borderBottom: idx !== arr.length - 1 ? '1px dashed #E2E8F0' : 'none',
                                alignItems: 'center', '&:hover': { bgcolor: '#FAFAFA' }, transition: '0.2s'
                            }}>
                            <ListItemText
                                    disableTypography
                                primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                            <Typography sx={{ fontWeight: 800, color: darkGray, fontSize: '1.05rem' }}>{mov.colaborador}</Typography>
                                            <Chip 
                                                label={mov.status === 'DEVOLVIDO' ? 'REPASSADO' : mov.status} 
                                                size="small" 
                                                sx={{ 
                                                    fontWeight: 800, fontSize: '0.65rem', borderRadius: 1.5, 
                                                    bgcolor: mov.status === 'EM_USO' ? '#FFFBEB' : '#F1F5F9', 
                                                    color: mov.status === 'EM_USO' ? '#D97706' : '#64748B' 
                                                }} 
                                            />
                                        </Box>
                                }
                                secondary={
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                                                <strong style={{ color: darkGray }}>Retirada:</strong> {new Date(mov.data_retirada).toLocaleString('pt-BR')} {mov.almoxarife_saida ? `por ${mov.almoxarife_saida}` : ''}
                                            </Typography>
                                            {mov.data_devolucao && (
                                                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                                                    <strong style={{ color: darkGray }}>Repasse/Encerramento:</strong> {new Date(mov.data_devolucao).toLocaleString('pt-BR')}
                                                </Typography>
                                            )}
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                    </List>
                </Box>
            ) : (
                <Box sx={{ textAlign: 'center', p: 4, color: '#94A3B8', border: '1px dashed #E2E8F0', borderRadius: 4 }}>
                    <Typography sx={{ fontWeight: 600 }}>Nenhum ciclo ativo encontrado.</Typography>
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'center' }}>
            <Button 
              onClick={() => setHistoryOpen(false)} 
              variant="contained"
              sx={{ 
                bgcolor: darkGray, color: 'white', fontWeight: 800, px: 6, py: 1.5, borderRadius: 3,
                textTransform: 'none', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: marconBlue, transform: 'translateY(-2px)' }, transition: 'all 0.3s'
              }}
            >
              Fechar Histórico
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}