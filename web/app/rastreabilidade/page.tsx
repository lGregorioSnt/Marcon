"use client";

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/api'; // Usar o wrapper de fetch autenticado
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  Container, Box, Typography, Paper, Table, TableBody, Dialog, DialogTitle, Divider,
  DialogContent, DialogActions, CircularProgress, List, ListItem, ListItemText, FormControl,
  TableCell, TableContainer, TableHead, TableRow, Chip, 
  InputLabel, OutlinedInput, Avatar, Input,
  TextField, InputAdornment, Button, IconButton, Tooltip, Fade, Skeleton
} from '@mui/material'; // Adicionado FormGroup, FormControlLabel, Checkbox
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';

// Tipagem para os itens do histórico de auditoria
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
interface AuditoriaItem {
  id: number;
  ferramenta: string;
  ferramenta_codigo: string;
  colaborador: string;
  data_retirada: string;
  data_devolucao: string | null;
  status: string;
  condicao_devolucao: string | null;
  observacao: string | null;
}

// Tipagem para os dados do modal de histórico
interface ToolHistory {
  ferramenta: {
    codigo: string;
    descricao: string;
    status: string;
  };
  historico: {
    id: number;
    colaborador: string;
    data_retirada: string;
    data_devolucao: string | null;
    status: string;
    almoxarife_saida: string;
    almoxarife_entrada: string | null;
    condicao_devolucao: string | null;
  }[];
}

export default function RastreabilidadePage() {
  const [dados, setDados] = useState<AuditoriaItem[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  // Estados para o modal de detalhes
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalHistoryFilter, setModalHistoryFilter] = useState<string | null>(null);
  const [selectedToolHistory, setSelectedToolHistory] = useState<ToolHistory | null>(null);

  // Novos estados para o modal de exportação
  const marconBlue = "#00509d";
  const darkGray = "#1A1C1E";

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('http://localhost:4000/api/movimentacoes/auditoria');
      if (Array.isArray(data)) {
        setDados(data);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportStatusFilters, setExportStatusFilters] = useState({
    emUso: false,
    devolvido: false,
    manutencao: false, // Corresponde a 'ENVIADO_MANUTENCAO'
  });
  const [exportConditionFilters, setExportConditionFilters] = useState({
    perfeitoEstado: false,
    desgasteNatural: false,
    quebrada: false,
  });


  useEffect(() => { carregarHistorico(); }, []);

  const handleRowClick = async (codigo: string) => {
    setModalOpen(true);
    setModalLoading(true);
    setModalHistoryFilter(null); // Reseta o filtro do modal
    try {
      const data = await fetchWithAuth(`http://localhost:4000/api/ferramentas/historico/${codigo}`); // Caminho da API corrigido
      setSelectedToolHistory(data);
    } catch (error) {
      console.error("Erro ao buscar histórico da ferramenta:", error);
      setSelectedToolHistory(null); 
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleOpenExportModal = () => {
    // Inicializa os filtros de exportação com os filtros atuais da tabela, se houver
    setExportStartDate(startDate);
    setExportEndDate(endDate);
    setExportStatusFilters({
      emUso: activeFilter === 'EM_USO',
      devolvido: activeFilter === 'DEVOLVIDO',
      manutencao: false, // Não há um filtro direto 'manutencao' na tabela principal
    });
    setExportConditionFilters({
      perfeitoEstado: false,
      desgasteNatural: false,
      quebrada: activeFilter === 'COM_DEFEITO', // 'COM_DEFEITO' na tabela significa 'QUEBRADA'
    });
    setExportModalOpen(true);
  };

  const handleCloseExportModal = () => {
    setExportModalOpen(false);
  };

  const handleConfirmExportExcel = async () => { // Renomeado para refletir a ação de confirmação
    handleCloseExportModal(); // Fecha o modal de opções de exportação imediatamente
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Auditoria_Ativos');

    // 1. Configurar as larguras das colunas
    worksheet.columns = [
      { key: 'ativo', width: 35 },
      { key: 'patrimonio', width: 15 },
      { key: 'colaborador', width: 30 },
      { key: 'retirada', width: 22 },
      { key: 'devolucao', width: 22 },
      { key: 'status', width: 15 },
      { key: 'condicao', width: 22 },
      { key: 'obs', width: 50 }
    ];

    // Aplica os filtros específicos para a exportação
    const filteredForExport = dados.filter((item: AuditoriaItem) => {
      const statusMatch = (() => {
        if (!exportStatusFilters.emUso && !exportStatusFilters.devolvido && !exportStatusFilters.manutencao) return true; // Se nenhum filtro de status for selecionado, inclui todos
        return (
          (exportStatusFilters.emUso && item.status === 'EM_USO') ||
          (exportStatusFilters.devolvido && item.status === 'DEVOLVIDO') ||
          (exportStatusFilters.manutencao && item.status === 'ENVIADO_MANUTENCAO')
        );
      })();

      const conditionMatch = (() => {
        if (!exportConditionFilters.perfeitoEstado && !exportConditionFilters.desgasteNatural && !exportConditionFilters.quebrada) return true; // Se nenhum filtro de condição for selecionado, inclui todos
        return (
          (exportConditionFilters.perfeitoEstado && item.condicao_devolucao === 'PERFEITO ESTADO') ||
          (exportConditionFilters.desgasteNatural && item.condicao_devolucao === 'DESGASTE NATURAL') ||
          (exportConditionFilters.quebrada && item.condicao_devolucao === 'QUEBRADA')
        );
      })();

      const dateMatch = (() => {
        if (!exportStartDate && !exportEndDate) return true;
        const itemDate = new Date(item.data_retirada);
        if (exportStartDate && itemDate < new Date(exportStartDate + 'T00:00:00')) return false;
        if (exportEndDate && itemDate > new Date(exportEndDate + 'T23:59:59')) return false;
        return true;
      })();

      return statusMatch && conditionMatch && dateMatch;
    });

    // 2. Criar Cabeçalho Estilizado (inalterado)
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'RELATÓRIO DE AUDITORIA E RASTREABILIDADE DE ATIVOS - MARCON';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00509d' } }; // Laranja Marcon
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:H2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Documento gerado em: ${new Date().toLocaleString('pt-BR')}`;
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'right' };

    worksheet.addRow([]); // Linha em branco (Linha 3)

    // 3. Criar Linha de Cabeçalho de Dados Estilizada (Linha 4)
    const headerRow = worksheet.addRow(['Ativo', 'Patrimônio', 'Colaborador', 'Data Retirada', 'Data Devolução', 'Status', 'Condição Devolução', 'Observação']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1C1E' } }; // Cinza Escuro
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // 4. Adicionar e Estilizar Dados
    filteredForExport.forEach((item, index) => { // Usa filteredForExport aqui
      const row = worksheet.addRow([
        item.ferramenta,
        item.ferramenta_codigo,
        item.colaborador,
        new Date(item.data_retirada).toLocaleString('pt-BR'),
        item.data_devolucao ? new Date(item.data_devolucao).toLocaleString('pt-BR') : 'Pendente',
        item.status,
        item.condicao_devolucao || '---',
        item.observacao || '---'
      ]);

      // Estilos para células de dados
      row.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0'} }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0'} }, left: { style: 'thin', color: { argb: 'FFE2E8F0'} }, right: { style: 'thin', color: { argb: 'FFE2E8F0'} } };
        cell.alignment = { vertical: 'middle', horizontal: colNumber >= 6 ? 'center' : 'left' };

        // Cores alternadas para as linhas (Efeito Zebrado para leitura)
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }

        // Destacar Status e Condição com cores baseadas no contexto
        if (colNumber === 6) { // Status
          cell.font = { bold: true, color: { argb: cell.value === 'DEVOLVIDO' ? 'FF16A34A' : 'FFD97706' } };
        }
        if (colNumber === 7 && cell.value === 'QUEBRADA') { // Condição
          cell.font = { bold: true, color: { argb: 'FFDC2626' } };
        }
      });
    });

    // 5. Gerar e baixar o arquivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Relatorio_Rastreabilidade_Marcon.xlsx');
  };

  const handleExportStatusFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExportStatusFilters({
      ...exportStatusFilters,
      [event.target.name]: event.target.checked,
    });
  };

  const handleExportConditionFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExportConditionFilters({
      ...exportConditionFilters,
      [event.target.name]: event.target.checked,
    });
  };

  const filtrados = dados.filter((item: AuditoriaItem) => {
    const buscaMatch =
      item.ferramenta.toLowerCase().includes(busca.toLowerCase()) ||
      item.colaborador.toLowerCase().includes(busca.toLowerCase()) ||
      item.ferramenta_codigo.toString().includes(busca);

    const filterMatch = (() => {
      if (!activeFilter) return true;
      return (
        (activeFilter === 'EM_USO' && item.status === 'EM_USO') ||
        (activeFilter === 'DEVOLVIDO' && item.status === 'DEVOLVIDO') ||
        (activeFilter === 'COM_DEFEITO' && item.condicao_devolucao === 'QUEBRADA')
      );
    })();

    const dateMatch = (() => {
      if (!startDate && !endDate) return true;
      const itemDate = new Date(item.data_retirada);
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

    return buscaMatch && filterMatch && dateMatch;
  });

  return (
    <Box sx={{ bgcolor: '#FAFAFA', minHeight: '100vh', py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Container maxWidth="lg">
        
        {/* CABEÇALHO DA PÁGINA */}
        <Fade in={true} timeout={600}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ bgcolor: marconBlue, color: 'white', width: 56, height: 56, borderRadius: 3, boxShadow: '0 4px 15px rgba(0, 80, 157, 0.3)' }}>
                <HistoryIcon sx={{ fontSize: 28 }} /> 
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, color: darkGray, letterSpacing: '-2px' }}>
                  Rastreabilidade
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#64748B', fontWeight: 500, mt: 0.5 }}>
                  LOG DE MOVIMENTAÇÕES E AUDITORIA DE ATIVOS
                </Typography>
              </Box>
            </Box>
            <Button 
              variant="outlined"
              onClick={handleOpenExportModal} // Abre o modal de opções de exportação
              startIcon={<FileDownloadIcon />}
              sx={{ 
                borderRadius: 3, fontWeight: 800, color: darkGray, borderColor: '#E2E8F0', 
                textTransform: 'none', px: 3, py: 1.5, bgcolor: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' }
              }}
            >
              Exportar para Excel
            </Button>
          </Box>
        </Fade>

        <Fade in={true} timeout={800}>
          <Box>
            {/* ÁREA DE FILTROS E BUSCA */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                <Paper elevation={0} sx={{ 
                    flex: 1, p: 2, borderRadius: 4, display: 'flex', alignItems: 'center', 
                    border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' 
                }}>
                  <FormControl fullWidth variant="standard">
                    <Input
                      disableUnderline // Para remover o sublinhado do Input padrão
                      value={busca}
                      onChange={(e : any) => setBusca(e.target.value)}
                      startAdornment={
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: marconBlue, mx: 2 }} />
                        </InputAdornment>
                      }
                      sx={{ fontSize: '1.1rem', fontWeight: 500, color: darkGray }}
                      placeholder="Buscar por ferramenta, colaborador ou ID..."
                    />
                  </FormControl>
                  <Tooltip title="Filtros Avançados">
                    <IconButton sx={{ bgcolor: '#F8FAFC', mr: 1 }}>
                        <FilterListIcon sx={{ color: darkGray }} />
                    </IconButton>
                  </Tooltip>
                </Paper>
            </Box>

            {/* BOTÕES DE FILTRO RÁPIDO */}
            <Paper elevation={0} sx={{ 
                p: 2, mb: 4, borderRadius: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', 
                border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' 
            }}>
                <Typography sx={{ fontWeight: 800, color: darkGray, mr: 1 }}>Filtros:</Typography>
                <Chip 
                    label="Todos" 
                    onClick={() => setActiveFilter(null)}
                    variant={!activeFilter ? 'filled' : 'outlined'}
                    sx={{ 
                        fontWeight: 800, cursor: 'pointer', borderRadius: 2, px: 1,
                        ...(!activeFilter && { bgcolor: darkGray, color: 'white', border: 'none' })
                    }}
                />
                <Chip 
                    label="Em Uso" 
                    onClick={() => setActiveFilter('EM_USO')}
                    variant={activeFilter === 'EM_USO' ? 'filled' : 'outlined'}
                    sx={{ 
                        fontWeight: 800, cursor: 'pointer', borderRadius: 2, px: 1,
                        ...(activeFilter === 'EM_USO' && { bgcolor: '#F59E0B', color: 'white', border: 'none' })
                    }}
                />
                <Chip 
                    label="Devolvidos" 
                    onClick={() => setActiveFilter('DEVOLVIDO')}
                    variant={activeFilter === 'DEVOLVIDO' ? 'filled' : 'outlined'}
                    sx={{ 
                        fontWeight: 800, cursor: 'pointer', borderRadius: 2, px: 1,
                        ...(activeFilter === 'DEVOLVIDO' && { bgcolor: '#16A34A', color: 'white', border: 'none' })
                    }}
                />
                <Chip 
                    label="Com Defeito" 
                    onClick={() => setActiveFilter('COM_DEFEITO')}
                    variant={activeFilter === 'COM_DEFEITO' ? 'filled' : 'outlined'}
                    sx={{ 
                        fontWeight: 800, cursor: 'pointer', borderRadius: 2, px: 1,
                        ...(activeFilter === 'COM_DEFEITO' && { bgcolor: '#DC2626', color: 'white', border: 'none' })
                    }}
                />
                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControl size="small" variant="outlined">
                        <InputLabel shrink htmlFor="start-date" sx={{ bgcolor: 'white', px: 1 }}>De</InputLabel>
                        <OutlinedInput
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            notched
                            sx={{ borderRadius: 2 }}
                        />
                    </FormControl>
                    <FormControl size="small" variant="outlined">
                        <InputLabel shrink htmlFor="end-date" sx={{ bgcolor: 'white', px: 1 }}>Até</InputLabel>
                        <OutlinedInput
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            notched
                            sx={{ borderRadius: 2 }}
                        />
                    </FormControl>
                </Box>
            </Paper>

            {/* TABELA DE RASTREABILIDADE */}
            <TableContainer component={Paper} elevation={0} sx={{ 
                borderRadius: 4, border: '1px solid #E2E8F0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', 
                maxHeight: '650px', bgcolor: 'white' 
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#F8FAFC', color: '#64748B', fontWeight: 800, borderBottom: '1px solid #E2E8F0' }}>Ativo / Patrimônio</TableCell>
                    <TableCell sx={{ bgcolor: '#F8FAFC', color: '#64748B', fontWeight: 800, borderBottom: '1px solid #E2E8F0' }}>Colaborador</TableCell>
                    <TableCell sx={{ bgcolor: '#F8FAFC', color: '#64748B', fontWeight: 800, borderBottom: '1px solid #E2E8F0' }}>Retirada</TableCell>
                    <TableCell sx={{ bgcolor: '#F8FAFC', color: '#64748B', fontWeight: 800, borderBottom: '1px solid #E2E8F0' }}>Devolução</TableCell>
                    <TableCell sx={{ bgcolor: '#F8FAFC', color: '#64748B', fontWeight: 800, borderBottom: '1px solid #E2E8F0' }} align="center">Status</TableCell>
                    <TableCell sx={{ bgcolor: '#F8FAFC', color: '#64748B', fontWeight: 800, borderBottom: '1px solid #E2E8F0' }} align="center">Condição</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [1,2,3,4,5].map(n => (
                        <TableRow key={n}>
                            <TableCell colSpan={6}><Skeleton height={50} sx={{ borderRadius: 2 }} /></TableCell>
                        </TableRow>
                    ))
                  ) : filtrados.map((item: AuditoriaItem) => (
                    <Fade in={true} key={item.id} timeout={500}>
                        <TableRow 
                          hover 
                          onClick={() => handleRowClick(item.ferramenta_codigo)}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer', transition: '0.2s', '&:hover': { bgcolor: '#FAFAFA' } }}
                        >
                        <TableCell sx={{ borderBottom: '1px dashed #E2E8F0' }}>
                            <Typography sx={{ fontWeight: 900, color: darkGray, fontSize: '1rem' }}>{item.ferramenta}</Typography>
                            <Chip label={item.ferramenta_codigo} size="small" sx={{ mt: 0.5, fontWeight: 700, bgcolor: '#F1F5F9', color: '#64748B', borderRadius: 1.5 }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: darkGray, borderBottom: '1px dashed #E2E8F0' }}>{item.colaborador}</TableCell>
                        <TableCell sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748B', borderBottom: '1px dashed #E2E8F0' }}>{new Date(item.data_retirada).toLocaleString('pt-BR')}</TableCell>
                        <TableCell sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748B', borderBottom: '1px dashed #E2E8F0' }}>
                            {item.data_devolucao ? new Date(item.data_devolucao).toLocaleString('pt-BR') : '--/--/----'}
                        </TableCell>
                        <TableCell align="center" sx={{ borderBottom: '1px dashed #E2E8F0' }}>
                            <Chip
                                label={item.status === 'EM_USO' ? 'Em Uso' : item.status === 'DEVOLVIDO' ? 'Devolvido' : 'Manutenção'}
                                size="small" 
                                sx={{ 
                                    fontWeight: 800, fontSize: '0.75rem', borderRadius: 1.5,
                                    bgcolor: item.status === 'DEVOLVIDO' ? '#F0FDF4' : '#FFFBEB',
                                    color: item.status === 'DEVOLVIDO' ? '#16A34A' : '#D97706'
                                }} 
                            />
                        </TableCell>
                        <TableCell align="center" sx={{ borderBottom: '1px dashed #E2E8F0' }}>
                            {item.condicao_devolucao === 'QUEBRADA' ? (
                                <Tooltip title={item.observacao || "Sem detalhes"}>
                                    <Chip 
                                        icon={<ErrorOutlineIcon style={{ color: 'white', fontSize: '1.2rem', marginLeft: '6px' }} />}
                                        label="CRÍTICO" 
                                        size="small" 
                                        sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 800, borderRadius: 1.5, '& .MuiChip-icon': { color: '#DC2626 !important' } }} 
                                    />
                                </Tooltip>
                            ) : (
                                <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700 }}>
                                    {item.condicao_devolucao || '---'}
                                </Typography>
                            )}
                        </TableCell>
                        </TableRow>
                    </Fade>
                  ))}
                </TableBody>
              </Table>
              {!loading && filtrados.length === 0 && (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                    <HistoryIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
                    <Typography color="textSecondary" sx={{ fontWeight: 600 }}>Nenhuma movimentação encontrada com os filtros atuais.</Typography>
                </Box>
              )}
            </TableContainer>
          </Box>
        </Fade>

        {/* MODAL DE HISTÓRICO DETALHADO */}
        <Dialog 
          open={modalOpen} 
          onClose={handleCloseModal} 
          fullWidth 
          maxWidth="md" 
          slotProps={{
            backdrop: { sx: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(26, 28, 30, 0.5)' } },
            paper: { sx: { borderRadius: 5, border: '1px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' } }
          }}
        >
          <DialogTitle sx={{ color: darkGray, fontWeight: 900, fontSize: '1.5rem', pb: 1, pt: 3, px: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <HistoryIcon sx={{ color: marconBlue }} />
            Histórico de Vida do Ativo
          </DialogTitle>
          <DialogContent sx={{ p: 4, pt: 2 }}>
            {modalLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress sx={{ color: marconBlue }} />
              </Box>
            ) : selectedToolHistory ? (
              <Box>
                <Box sx={{ bgcolor: '#F8FAFC', p: 3, borderRadius: 4, mb: 4, border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: darkGray }}>{selectedToolHistory.ferramenta.descricao}</Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, mt: 0.5 }}>Código Interno: {selectedToolHistory.ferramenta.codigo}</Typography>
                    </Box>
                    <Chip 
                        label={selectedToolHistory.ferramenta.status} 
                        sx={{ 
                            fontWeight: 800, borderRadius: 2, px: 1, py: 2.5,
                            bgcolor: selectedToolHistory.ferramenta.status === 'Disponível' ? '#F0FDF4' : '#FEF2F2',
                            color: selectedToolHistory.ferramenta.status === 'Disponível' ? '#16A34A' : '#DC2626'
                        }} 
                    />
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1px solid #F1F5F9' }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: darkGray }}>Filtrar Registros por Condição:</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Chip 
                            label="Todos"
                            size="small"
                            onClick={() => setModalHistoryFilter(null)}
                            sx={{
                                fontWeight: 800, cursor: 'pointer', borderRadius: 2, px: 1,
                                bgcolor: !modalHistoryFilter ? darkGray : '#F1F5F9',
                                color: !modalHistoryFilter ? 'white' : '#64748B',
                                '&:hover': { bgcolor: !modalHistoryFilter ? darkGray : '#E2E8F0' }
                            }}
                        />
                        <Chip 
                            label="Perfeito Estado"
                            size="small"
                            onClick={() => setModalHistoryFilter('PERFEITO ESTADO')}
                            sx={{
                                fontWeight: 800, cursor: 'pointer', borderRadius: 2, px: 1,
                                bgcolor: modalHistoryFilter === 'PERFEITO ESTADO' ? '#16A34A' : '#F1F5F9',
                                color: modalHistoryFilter === 'PERFEITO ESTADO' ? 'white' : '#64748B',
                                '&:hover': { bgcolor: modalHistoryFilter === 'PERFEITO ESTADO' ? '#15803D' : '#E2E8F0' }
                            }}
                        />
                        <Chip 
                            label="Desgaste Natural"
                            size="small"
                            onClick={() => setModalHistoryFilter('DESGASTE NATURAL')}
                            sx={{
                                fontWeight: 800, cursor: 'pointer', borderRadius: 2, px: 1,
                                bgcolor: modalHistoryFilter === 'DESGASTE NATURAL' ? '#F59E0B' : '#F1F5F9',
                                color: modalHistoryFilter === 'DESGASTE NATURAL' ? 'white' : '#64748B',
                                '&:hover': { bgcolor: modalHistoryFilter === 'DESGASTE NATURAL' ? '#D97706' : '#E2E8F0' }
                            }}
                        />
                        <Chip 
                            label="Quebrada"
                            size="small"
                            onClick={() => setModalHistoryFilter('QUEBRADA')}
                            sx={{
                                fontWeight: 800, cursor: 'pointer', borderRadius: 2, px: 1,
                                bgcolor: modalHistoryFilter === 'QUEBRADA' ? '#DC2626' : '#F1F5F9',
                                color: modalHistoryFilter === 'QUEBRADA' ? 'white' : '#64748B',
                                '&:hover': { bgcolor: modalHistoryFilter === 'QUEBRADA' ? '#B91C1C' : '#E2E8F0' }
                            }}
                        />
                    </Box>
                </Box>

                <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 1, border: '1px solid #E2E8F0', borderRadius: 4, bgcolor: 'white' }}>
                  {selectedToolHistory.historico.filter(mov => !modalHistoryFilter || mov.condicao_devolucao === modalHistoryFilter).length > 0 ? (
                    <List dense sx={{ p: 0, overflow: 'hidden' }}>
                      {selectedToolHistory.historico
                        .filter(mov => !modalHistoryFilter || mov.condicao_devolucao === modalHistoryFilter)
                        .map((mov, idx, arr) => (
                        <ListItem key={mov.id} sx={{ 
                            py: 2.5, px: 3, borderBottom: idx !== arr.length - 1 ? '1px dashed #E2E8F0' : 'none',
                            alignItems: 'center', '&:hover': { bgcolor: '#FAFAFA' }, transition: '0.2s'
                        }}>
                          <ListItemText
                            disableTypography
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                <Typography sx={{ fontWeight: 800, color: darkGray, fontSize: '1.05rem' }}>{mov.colaborador}</Typography>
                                <Chip label={mov.status} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', borderRadius: 1.5, bgcolor: '#F1F5F9', color: '#64748B' }} />
                              </Box>
                            }
                            secondary={
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                                        <strong style={{ color: darkGray }}>Saída:</strong> {new Date(mov.data_retirada).toLocaleString('pt-BR')} por {mov.almoxarife_saida}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                                        <strong style={{ color: darkGray }}>Retorno:</strong> {mov.data_devolucao ? new Date(mov.data_devolucao).toLocaleString('pt-BR') : 'Pendente'}
                                    </Typography>
                                </Box>
                            }
                          />
                          {mov.condicao_devolucao && (
                            <Chip 
                              label={mov.condicao_devolucao} 
                              size="small"
                              sx={{ 
                                ml: 2, fontWeight: 800, borderRadius: 1.5, px: 1,
                                bgcolor: mov.condicao_devolucao === 'QUEBRADA' ? '#FEF2F2' : mov.condicao_devolucao === 'PERFEITO ESTADO' ? '#F0FDF4' : '#FFFBEB',
                                color: mov.condicao_devolucao === 'QUEBRADA' ? '#DC2626' : mov.condicao_devolucao === 'PERFEITO ESTADO' ? '#16A34A' : '#D97706'
                              }}
                            />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', p: 4, color: '#94A3B8' }}>
                        <Typography sx={{ fontWeight: 600 }}>Nenhum registro encontrado para este filtro.</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ) : (
              <Typography color="error" sx={{ fontWeight: 700 }}>Não foi possível carregar o histórico desta ferramenta.</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 4, pt: 2, justifyContent: 'center' }}>
            <Button 
              onClick={handleCloseModal} 
              variant="contained"
              sx={{ 
                  bgcolor: darkGray, color: 'white', fontWeight: 800, px: 5, py: 1.5, borderRadius: 3,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textTransform: 'none', fontSize: '1rem',
                  '&:hover': { bgcolor: marconBlue, transform: 'translateY(-2px)' },
                  transition: 'all 0.3s'
              }}
            >
              Fechar Detalhes
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL DE OPÇÕES DE EXPORTAÇÃO */}
        <Dialog
          open={exportModalOpen}
          onClose={handleCloseExportModal}
          fullWidth
          maxWidth="sm"
          slotProps={{
            backdrop: { sx: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(26, 28, 30, 0.5)' } },
            paper: { sx: { borderRadius: 5, border: '1px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' } }
          }}
        >
          <DialogTitle sx={{ color: darkGray, fontWeight: 900, fontSize: '1.5rem', pb: 1, pt: 3, px: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FileDownloadIcon sx={{ color: marconBlue }} />
            Opções de Exportação para Excel
          </DialogTitle>
          <DialogContent sx={{ p: 4, pt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: darkGray, mb: 1 }}>
              Filtrar por Período:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <FormControl size="small" variant="outlined" fullWidth>
                <InputLabel shrink htmlFor="export-start-date" sx={{ bgcolor: 'white', px: 1 }}>De</InputLabel>
                <OutlinedInput
                  id="export-start-date"
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  notched
                  sx={{ borderRadius: 2 }}
                />
              </FormControl>
              <FormControl size="small" variant="outlined" fullWidth>
                <InputLabel shrink htmlFor="export-end-date" sx={{ bgcolor: 'white', px: 1 }}>Até</InputLabel>
                <OutlinedInput
                  id="export-end-date"
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  notched
                  sx={{ borderRadius: 2 }}
                />
              </FormControl>
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: darkGray, mb: 1 }}>
              Filtrar por Status da Movimentação:
            </Typography>
            <FormGroup row sx={{ mb: 3 }}>
              <FormControlLabel
                control={<Checkbox checked={exportStatusFilters.emUso} onChange={handleExportStatusFilterChange} name="emUso" />}
                label="Em Uso"
              />
              <FormControlLabel
                control={<Checkbox checked={exportStatusFilters.devolvido} onChange={handleExportStatusFilterChange} name="devolvido" />}
                label="Devolvido"
              />
              <FormControlLabel
                control={<Checkbox checked={exportStatusFilters.manutencao} onChange={handleExportStatusFilterChange} name="manutencao" />}
                label="Em Manutenção"
              />
            </FormGroup>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: darkGray, mb: 1 }}>
              Filtrar por Condição de Devolução:
            </Typography>
            <FormGroup row>
              <FormControlLabel
                control={<Checkbox checked={exportConditionFilters.perfeitoEstado} onChange={handleExportConditionFilterChange} name="perfeitoEstado" />}
                label="Perfeito Estado"
              />
              <FormControlLabel
                control={<Checkbox checked={exportConditionFilters.desgasteNatural} onChange={handleExportConditionFilterChange} name="desgasteNatural" />}
                label="Desgaste Natural"
              />
              <FormControlLabel
                control={<Checkbox checked={exportConditionFilters.quebrada} onChange={handleExportConditionFilterChange} name="quebrada" />}
                label="Quebrada"
              />
            </FormGroup>

          </DialogContent>
          <DialogActions sx={{ p: 4, pt: 2, justifyContent: 'center', gap: 2 }}>
            <Button
              onClick={handleCloseExportModal}
              variant="outlined"
              sx={{
                  fontWeight: 800, px: 4, py: 1.5, borderRadius: 3, textTransform: 'none', fontSize: '1rem',
                  borderColor: '#E2E8F0', color: darkGray,
                  '&:hover': { borderColor: marconBlue, color: marconBlue },
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmExportExcel} // Corrigido: Chamando a função renomeada
              variant="contained"
              startIcon={<FileDownloadIcon />}
              sx={{
                  bgcolor: marconBlue, color: 'white', fontWeight: 800, px: 4, py: 1.5, borderRadius: 3,
                  boxShadow: `0 4px 15px ${marconBlue}40`, textTransform: 'none', fontSize: '1rem',
                  '&:hover': { bgcolor: '#003a70', transform: 'translateY(-2px)' },
                  transition: 'all 0.3s'
              }}
            >
              Confirmar Exportação
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
}