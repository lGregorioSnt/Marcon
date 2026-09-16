"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image"; 
import { fetchWithAuth } from '../lib/api';
import {
  Box, Paper, Typography, Button, Modal, TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, InputBase, Select, Snackbar, Alert, IconButton, Divider, Container, Tooltip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from '@mui/icons-material/Clear';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import HardwareIcon from '@mui/icons-material/Hardware';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface Ticket {
  id: number;
  assunto: string;
  descricao: string;
  categoria: string;
  ferramentas: string;
  prioridade: 'baixa' | 'media' | 'alta' | string;
  status: string;
  data_criacao: string;
  ativo_id?: string;
  anexo_urls: string[];
}

const modalStyle = {  
  position: "absolute" as const, 
  top: "50%", 
  left: "50%", 
  transform: "translate(-50%, -50%)", 
  width: { xs: '95%', sm: 600 }, 
  bgcolor: "white", 
  borderRadius: "16px", 
  boxShadow: '0 24px 48px rgba(0,0,0,0.2)', 
  p: 4, 
  outline: 'none', 
  maxHeight: '90vh', 
  overflowY: 'auto' 
};

const getUrgenciaStyle = (level: string) => {
  switch((level || '').trim().toLowerCase()) {
    case 'alta': return { bg: '#ffebee', text: '#c62828' }; 
    case 'média': 
    case 'media': return { bg: '#fff3e0', text: '#ed6c02' }; 
    case 'baixa': return { bg: '#e8f5e9', text: '#2e7d32' }; 
    default: return { bg: '#f5f5f5', text: '#666' }; 
  }
};

const UrgenciaDot = ({ level }: { level: string }) => {
  const capitalizedLevel = level ? level.charAt(0).toUpperCase() + level.slice(1) : '';
  const style = getUrgenciaStyle(level);
  
  return (
    <Box sx={{ 
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      px: 1.5, py: 0.5, borderRadius: '12px', mt: 0.5,
      fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', 
      bgcolor: style.bg, color: style.text, border: '1px solid currentColor' 
    }}>
      {capitalizedLevel}
    </Box>
  );
};

export default function SuportePage() {
  const [mounted, setMounted] = useState(false);
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeOrder, setActiveOrder] = useState("");

  const [showResolved, setShowResolved] = useState(false); 

  const loadTickets = async () => {
    try {
      const data = await fetchWithAuth('http://localhost:4000/api/suporte');
      if (Array.isArray(data)) setTickets(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadTickets();
  }, []);

  const filteredAndSortedTickets = useMemo(() => {
    let filteredTickets = [...tickets];

    if (!showResolved) {
      filteredTickets = filteredTickets.filter(ticket => 
        !['resolvido', 'cancelado'].includes((ticket.status || '').toLowerCase())
      );
    }

    if (activeSearch.trim() !== "") { 
      filteredTickets = filteredTickets.filter(ticket => ticket.assunto.toLowerCase().includes(activeSearch.toLowerCase()) || ticket.id.toString().includes(activeSearch)); 
    }
    switch (activeOrder) {
      case 'data': 
        filteredTickets.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()); 
        break;
      case 'urgencia': 
        const priorityOrder: Record<string, number> = { 'alta': 3, 'média': 2, 'media': 2, 'baixa': 1 }; 
        filteredTickets.sort((a, b) => (priorityOrder[(b.prioridade || '').toLowerCase()] || 0) - (priorityOrder[(a.prioridade || '').toLowerCase()] || 0)); 
        break;
      case 'status': 
        filteredTickets.sort((a, b) => (a.status || '').localeCompare(b.status || '')); 
        break;
      default: break;
    }
    return filteredTickets;
  }, [tickets, activeSearch, activeOrder, showResolved]);

  const handleFilterClick = () => { setActiveSearch(search); setActiveOrder(order); };
  const handleClearFiltersClick = () => { setSearch(''); setOrder(''); setActiveSearch(''); setActiveOrder(''); };
  
  const handleReopen = async (id: number) => {
    try {
      await fetchWithAuth(`http://localhost:4000/api/suporte/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Pendente' })
      });
      loadTickets();
      setNotification({ open: true, message: 'Chamado reaberto com sucesso!', severity: 'success' });
      setIsViewModalOpen(false);
    } catch (e) {
      setNotification({ open: true, message: 'Erro ao reabrir chamado.', severity: 'error' });
    }
  };

  const handleConfirmResolution = async () => {
    if (!selectedTicket) return;
    try {
      await fetchWithAuth(`http://localhost:4000/api/suporte/${selectedTicket.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolvido' })
      });
      loadTickets();
      setNotification({ open: true, message: 'Chamado encerrado com sucesso!', severity: 'success' });
      setIsViewModalOpen(false);
    } catch (e) {
      setNotification({ open: true, message: 'Erro ao encerrar chamado.', severity: 'error' });
    }
  };

  const getStatusStyle = (status: string) => {
    switch((status || '').trim().toLowerCase()) {
      case 'resolvido': return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'em andamento': return { bg: '#e3f2fd', text: '#1565c0' };
      case 'pendente': return { bg: '#fff3e0', text: '#ed6c02' };
      case 'cancelado': return { bg: '#ffebee', text: '#c62828' }; 
      default: return { bg: '#f5f5f5', text: '#666' };
    }
  };

  if (!mounted) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f4f6f8" }}>
      
      <Box sx={{ 
        width: '100%', 
        bgcolor: '#00509d',
        color: 'white', 
        py: { xs: 6, md: 8 }, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        boxShadow: 'inset 0px -4px 10px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.8rem', md: '2.5rem' }, letterSpacing: '-0.5px' }}>
          Suporte e Manutenção
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 400, mb: 4, opacity: 0.95 }}>
          Relate problemas nos equipamentos e solicite as ferramentas necessárias.
        </Typography>
        
        <Paper sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 650, borderRadius: '30px', p: '4px 16px', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}>
          <InputBase 
            sx={{ ml: 1, flex: 1, py: 1, fontSize: '1.1rem' }} 
            placeholder="Pesquisar chamados e problemas..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleFilterClick()} 
          />
          <IconButton type="button" sx={{ p: '10px', color: '#00509d' }} onClick={handleFilterClick}>
            <SearchIcon fontSize="medium" />
          </IconButton>
        </Paper>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6, mb: 8, position: 'relative', zIndex: 2 }}>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1b1b1b' }}>Meus Relatos e Solicitações</Typography>
          <Box sx={{ display: "flex", flexWrap: 'wrap', gap: 2 }}>
            
            <Tooltip title={showResolved ? "Esconder resolvidos" : "Mostrar histórico completo"}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => setShowResolved(!showResolved)}
                sx={{ 
                  color: showResolved ? '#00509d' : '#666', 
                  borderColor: showResolved ? '#00509d' : '#ccc', 
                  bgcolor: showResolved ? '#FFF1EB' : 'white',
                  textTransform: 'none', borderRadius: '8px',
                  fontWeight: showResolved ? 'bold' : 'normal'
                }}
              >
                {showResolved ? <VisibilityOffIcon sx={{ mr: 0.5, fontSize: 18 }} /> : <VisibilityIcon sx={{ mr: 0.5, fontSize: 18 }} />}
                {showResolved ? "Esconder Resolvidos" : "Mostrar Resolvidos"}
              </Button>
            </Tooltip>

            <Select value={order} onChange={(e) => setOrder(e.target.value as string)} displayEmpty size="small" sx={{ borderRadius: "8px", bgcolor: "white", width: 180, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <MenuItem value="" disabled><em>Ordenar por</em></MenuItem>
              <MenuItem value="data">Mais Recentes</MenuItem>
              <MenuItem value="urgencia">Prioridade</MenuItem>
              <MenuItem value="status">Status</MenuItem>
            </Select>
            <Button variant="outlined" size="small" onClick={handleClearFiltersClick} sx={{ color: '#666', borderColor: '#ccc', textTransform: 'none', borderRadius: '8px', bgcolor: 'white' }}><RestartAltIcon sx={{ mr: 0.5, fontSize: 18 }} /> Limpar</Button>
            <Button variant="outlined" size="small" onClick={handleFilterClick} sx={{ color: '#00509d', borderColor: '#00509d', textTransform: 'none', borderRadius: '8px', bgcolor: 'white' }}><FilterListIcon sx={{ mr: 0.5, fontSize: 18 }} /> Aplicar</Button>
          </Box>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
          <Table stickyHeader> 
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9' }}>PROBLEMA</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9' }}>EQUIPAMENTO</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9' }}>DATA</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9' }}>URGÊNCIA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedTickets.length > 0 ? filteredAndSortedTickets.map((ticket) => {
                const currentStatus = ticket.status ? String(ticket.status) : 'Pendente';
                return (
                  <TableRow key={ticket.id} onClick={() => { setSelectedTicket(ticket); setIsViewModalOpen(true); }} sx={{ cursor: 'pointer', transition: 'background-color 0.2s', '&:hover': { backgroundColor: '#FFF1EB' } }}>
                    <TableCell sx={{ color: "#00509d", fontWeight: "700" }}>#{ticket.id}</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#1e293b' }}>{ticket.assunto}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HardwareIcon fontSize="small" sx={{ color: '#888' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#555' }}>{ticket.ativo_id || '--'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'inline-block', px: 1.5, py: 0.6, borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', bgcolor: getStatusStyle(currentStatus).bg, color: getStatusStyle(currentStatus).text, border: `1px solid ${getStatusStyle(currentStatus).text}40` }}>
                        {currentStatus}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{new Date(ticket.data_criacao).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell><UrgenciaDot level={ticket.prioridade} /></TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: '#888', fontSize: '1.1rem' }}>Nenhum relato encontrado para os filtros selecionados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {/* MODAL DETALHES DO CHAMADO */}
      <Modal open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)}>
        <Box sx={modalStyle}>
          {selectedTicket && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1b1b1b' }}>Relato #{selectedTicket.id}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'inline-block', px: 1.5, py: 0.6, borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', bgcolor: getStatusStyle(selectedTicket.status).bg, color: getStatusStyle(selectedTicket.status).text, border: `1px solid ${getStatusStyle(selectedTicket.status).text}40` }}>
                    {selectedTicket.status || 'Pendente'}
                  </Box>
                  <IconButton onClick={() => setIsViewModalOpen(false)}><ClearIcon /></IconButton>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 4 }}>
                <Box sx={{ width: '45%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#888' }}>PROBLEMA</Typography>
                  <Typography sx={{ fontWeight: 500, color: '#1e293b', mt: 0.5 }}>{selectedTicket.assunto}</Typography>
                </Box>
                <Box sx={{ width: '45%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#888' }}>EQUIPAMENTO</Typography>
                  <Typography sx={{ fontWeight: 500, color: '#1e293b', mt: 0.5 }}>{selectedTicket.ativo_id || 'Não informado'}</Typography>
                </Box>
                <Box sx={{ width: '45%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#888' }}>PRIORIDADE</Typography>
                  <UrgenciaDot level={selectedTicket.prioridade} />
                </Box>
                <Box sx={{ width: '45%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#888' }}>CATEGORIA</Typography>
                  <Typography sx={{ fontWeight: 500, color: '#1e293b', mt: 0.5 }}>{selectedTicket.categoria}</Typography>
                </Box>
              </Box>
              
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#888' }}>DESCRIÇÃO DO PROBLEMA</Typography>
              <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#f8fafc', mt: 1, borderRadius: '8px', maxHeight: 150, overflowY: 'auto', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 400, color: '#1e293b', lineHeight: 1.6 }}>{selectedTicket.descricao}</Typography>
              </Paper> 

              <Typography variant="caption" sx={{ fontWeight: 600, color: '#888' }}>FERRAMENTAS NECESSÁRIAS</Typography>
              <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#FFF1EB', mt: 1, borderRadius: '8px', borderColor: '#00509d' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#D94E1B', lineHeight: 1.6 }}>{selectedTicket.ferramentas || 'Nenhuma ferramenta especificada.'}</Typography>
              </Paper> 

              {selectedTicket.anexo_urls && selectedTicket.anexo_urls.length > 0 && (
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#888', mb: 1, display: 'block' }}>EVIDÊNCIAS (FOTOS)</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {selectedTicket.anexo_urls.map((url, index) => (
                      <Box
                        key={index} component={Image} onClick={() => { setActiveImageIndex(index); setIsImageModalOpen(true); }}
                        src={url} alt={`Anexo ${index + 1}`}
                        width={80} height={80} 
                        sx={{ objectFit: 'cover', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)', borderColor: '#00509d' } }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, gap: 2, flexWrap: 'wrap' }}>
                
                {['resolvido', 'cancelado'].includes((selectedTicket.status || '').toLowerCase()) && (
                  <Button onClick={() => handleReopen(selectedTicket.id)} variant="contained" color="warning" startIcon={<ReplayIcon />} sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '8px' }}>
                    Reabrir
                  </Button>
                )}

                {!['resolvido', 'cancelado'].includes((selectedTicket.status || '').toLowerCase()) ? (
                  <Button onClick={handleConfirmResolution} variant="contained" color="success" startIcon={<CheckCircleOutlineIcon />} sx={{ bgcolor: "#008037", textTransform: 'none', fontWeight: 'bold', borderRadius: '8px' }}>
                    Marcar como Resolvido
                  </Button>
                ) : <Box />} 
                
                <Button onClick={() => setIsViewModalOpen(false)} variant="outlined" sx={{ color: "#64748b", borderColor: '#cbd5e1', textTransform: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                  Fechar
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      <Modal open={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0, 0, 0, 0.85)' } } }}>
        <Box onClick={() => setIsImageModalOpen(false)} sx={{ outline: 'none', cursor: 'pointer', p: 2 }}>
          {selectedTicket && selectedTicket.anexo_urls && selectedTicket.anexo_urls[activeImageIndex] && (
            <Image 
              src={selectedTicket.anexo_urls[activeImageIndex]} 
              alt="Anexo em tela cheia" 
              width={1200}
              height={800}
              style={{ maxHeight: '90vh', maxWidth: '90vw', width: 'auto', height: 'auto', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
            />
          )}
        </Box>
      </Modal>

      <Snackbar open={notification.open} autoHideDuration={6000} onClose={() => setNotification({ ...notification, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} variant="filled" sx={{ width: '100%', borderRadius: '8px' }}>
          {notification.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}