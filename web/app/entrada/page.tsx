"use client";

import React, { useState } from 'react';
import { fetchWithAuth } from '../lib/api';
import { 
  Container, Box, Typography, Paper, Button, TextField, 
  Avatar, CircularProgress, Snackbar, Alert, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function EntradaFerramentaPage() {
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [processando, setProcessando] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // 📦 Estados da Pré-visualização
  const [previewData, setPreviewData] = useState<{codigo: string, descricao: string}[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const marconBlue = "#00509d";
  const darkGray = "#1A1C1E";

  // 🛠️ CADASTRO MANUAL (1 por 1)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || !descricao) {
      setFeedback({ open: true, message: 'Por favor, preencha todos os campos.', severity: 'error' });
      return;
    }

    setProcessando(true);
    try {
      const response = await fetchWithAuth('http://localhost:4000/api/ferramentas', {
        method: 'POST',
        body: JSON.stringify({ codigo, descricao })
      });
      setFeedback({ open: true, message: response.message || 'Ferramenta registrada com sucesso!', severity: 'success' });
      setCodigo('');
      setDescricao('');
    } catch (error: any) {
      setFeedback({ open: true, message: error.message || 'Falha ao registrar (já existe ou erro).', severity: 'error' });
    } finally {
      setProcessando(false);
    }
  };

  // 🚀 LER PLANILHA E GERAR PRÉ-VISUALIZAÇÃO
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.replace(/\r/g, '').trim()).filter(l => l);
        
        if (lines.length < 2) throw new Error("A planilha parece estar vazia ou sem dados.");

        const delimiter = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim().toUpperCase());
        
        const idxCod = headers.findIndex(h => h.includes('COD') || h.includes('CÓD'));
        const idxDesc = headers.findIndex(h => h.includes('DESC'));

        if (idxCod === -1 || idxDesc === -1) {
          throw new Error("Não encontrei as colunas 'Cod. Ferramenta' e 'Desc. Ferramenta'.");
        }

        const extraido: {codigo: string, descricao: string}[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map(c => c.trim());
          const codItem = cols[idxCod];
          const descItem = cols[idxDesc];

          if (codItem && descItem) {
            extraido.push({ codigo: codItem, descricao: descItem });
          }
        }

        if (extraido.length > 0) {
          setPreviewData(extraido);
          setShowPreview(true);
        } else {
          throw new Error("Nenhum dado válido encontrado na planilha.");
        }

      } catch (error: any) {
        setFeedback({ open: true, message: error.message || 'Erro ao ler o arquivo.', severity: 'error' });
      } finally {
        e.target.value = ''; 
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  // ✅ CONFIRMAR IMPORTAÇÃO (AGORA COM FILTRO ANTI-DUPLICIDADE PARA EVITAR ERRO 409)
  const handleConfirmImport = async () => {
    setShowPreview(false);
    setProcessando(true);
    setProgresso(0);

    try {
      // 1. Busca todas as ferramentas que JÁ EXISTEM no banco
      const ferramentasAtuais = await fetchWithAuth('http://localhost:4000/api/ferramentas');
      
      // Cria um catálogo rápido em memória com os códigos existentes
      const codigosExistentes = new Set(
        Array.isArray(ferramentasAtuais) 
          ? ferramentasAtuais.map((f: any) => f.codigo.toUpperCase()) 
          : []
      );

      // 2. Compara a planilha com o banco e separa SOMENTE o que é novo
      const novasFerramentas = previewData.filter(item => !codigosExistentes.has(item.codigo.toUpperCase()));
      const ignoradasCount = previewData.length - novasFerramentas.length;

      let sucessoCount = 0;
      let erroCount = ignoradasCount; // Ferramentas ignoradas por já existirem contam aqui

      // 3. Dispara o cadastro APENAS das ferramentas novas (Adeus erro 409!)
      if (novasFerramentas.length > 0) {
        for (let i = 0; i < novasFerramentas.length; i++) {
          const item = novasFerramentas[i];
          try {
            await fetchWithAuth('http://localhost:4000/api/ferramentas', {
              method: 'POST',
              body: JSON.stringify({ codigo: item.codigo, descricao: item.descricao })
            });
            sucessoCount++;
          } catch (err) {
            erroCount++; // Caso dê algum erro genérico diferente de 409
          }
          
          setProgresso(Math.round(((i + 1) / novasFerramentas.length) * 100));
        }
      }

      setFeedback({ 
        open: true, 
        message: `Importação limpa concluída! ${sucessoCount} inseridas. ${erroCount} já existiam e foram ignoradas.`, 
        severity: 'success' 
      });

    } catch (err) {
      setFeedback({ open: true, message: 'Erro de comunicação ao validar ferramentas.', severity: 'error' });
    } finally {
      setProcessando(false);
      setProgresso(0);
      setPreviewData([]);
    }
  };

  const handleCloseSnackbar = () => {
    setFeedback({ ...feedback, open: false });
  };

  return (
    <Box sx={{ bgcolor: '#F4F7FA', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="sm">
        
        {/* HEADER */}
        <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: darkGray, width: 60, height: 60, boxShadow: 3 }}>
            <AddCircleOutlineIcon sx={{ color: marconBlue, fontSize: 30 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: darkGray, letterSpacing: '-1px' }}>
              Entrada de Ativos
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
              CADASTRO DE NOVAS FERRAMENTAS NO ESTOQUE
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 4, borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          
          {/* BARRA DE PROGRESSO GLOBAL */}
          {processando && progresso > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: marconBlue }}>
                Inserindo novos registros no banco... {progresso}%
              </Typography>
              <LinearProgress variant="determinate" value={progresso} sx={{ height: 10, borderRadius: 5, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: marconBlue } }} />
            </Box>
          )}
          
          {/* AVISO QUANDO ESTÁ LENDO/FILTRANDO */}
          {processando && progresso === 0 && (
             <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#F8FAFC', p: 2, borderRadius: 3 }}>
               <CircularProgress size={20} sx={{ color: marconBlue }} />
               <Typography variant="subtitle2" sx={{ fontWeight: 700, color: darkGray }}>
                 Avaliando duplicidades com o servidor...
               </Typography>
             </Box>
          )}

          {/* FORMULÁRIO MANUAL */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth required disabled={processando}
                label="Código de Patrimônio (ID)" placeholder="Ex: FUR-003"
                value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              />
              <TextField
                fullWidth required disabled={processando}
                label="Descrição da Ferramenta" placeholder="Ex: Furadeira de Impacto Bosch 18V"
                value={descricao} onChange={(e) => setDescricao(e.target.value)}
              />
              <Button
                type="submit" variant="contained" disabled={processando}
                sx={{ py: 1.5, fontWeight: 800, fontSize: '1rem', borderRadius: 3, bgcolor: marconBlue, '&:hover': { bgcolor: '#D9501B' } }}
              >
                Registrar Nova Ferramenta
              </Button>
            </Box>
          </form>

          <Divider sx={{ my: 4, color: '#94A3B8', fontWeight: 600, fontSize: '0.85rem' }}>OU</Divider>

          {/* BOTÃO DE IMPORTAÇÃO (CSV) */}
          <Button
            component="label" fullWidth variant="outlined" disabled={processando}
            startIcon={<UploadFileIcon />}
            sx={{
              py: 1.5, fontWeight: 800, fontSize: '1rem', borderRadius: 3, color: darkGray, borderColor: '#E2E8F0', borderWidth: 2,
              '&:hover': { borderColor: darkGray, bgcolor: '#F8FAFC' }
            }}
          >
            Importar Planilha (.CSV)
            <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
          </Button>

        </Paper>
      </Container>

      {/* 🟢 MODAL DE PRÉ-VISUALIZAÇÃO */}
      <Dialog 
        open={showPreview} 
        onClose={() => setShowPreview(false)} 
        maxWidth="md" 
        fullWidth 
        sx={{ '& .MuiDialog-paper': { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: darkGray, pb: 1, borderBottom: '1px solid #E2E8F0' }}>
          Revisar Importação ({previewData.length} itens encontrados)
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC' }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC' }}>Descrição</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.slice(0, 50).map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={{ fontWeight: 600, color: marconBlue }}>{row.codigo}</TableCell>
                    <TableCell>{row.descricao}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {previewData.length > 50 && (
            <Typography variant="caption" sx={{ display: 'block', p: 2, textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
              Mostrando os primeiros 50 itens. O restante também será avaliado.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setShowPreview(false)} sx={{ color: '#64748B', fontWeight: 800 }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmImport} 
            variant="contained" 
            startIcon={<CheckCircleIcon />}
            sx={{ bgcolor: marconBlue, fontWeight: 800, borderRadius: 2, px: 3, '&:hover': { bgcolor: '#D9501B' } }}
          >
            Confirmar e Inserir no Banco
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={feedback.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={feedback.severity} sx={{ width: '100%', borderRadius: 3, fontWeight: 700 }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}