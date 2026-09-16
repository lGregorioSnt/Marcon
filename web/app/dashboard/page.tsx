"use client";

import React, { useEffect, useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Stack,
  Button,
  Avatar, // Added for header consistency
  Dialog, DialogTitle, DialogContent, DialogActions, // For export modal
  FormControl, InputLabel, OutlinedInput, // For export modal filters
} from "@mui/material";
import { usePathname } from "next/navigation";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

import { fetchWithAuth } from "../lib/api";

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DashboardIcon from '@mui/icons-material/Dashboard'; // For header consistency

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(true);

  // States for export modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const pathname = usePathname();

  const marconBlue = "#00509d";
  const darkGray = "#1A1C1E";

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const json = await fetchWithAuth("http://localhost:4000/api/dashboard");
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (pathname === '/dashboard') {
      load();
    }
  }, [pathname]);

  useEffect(() => {
    async function loadAI() {
      try {
        setLoadingAI(true);
        const json = await fetchWithAuth(
          "http://localhost:4000/api/ai/dashboard-insights"
        );
        setInsight(json.insight);
      } catch (err) {
        setInsight("Erro ao gerar insights. O serviço pode estar indisponível.");
      } finally {
        setLoadingAI(false);
      }
    }
    if (pathname === '/dashboard') {
      loadAI();
    }
  }, [pathname]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  // =========================
  // STYLE SYSTEM
  // =========================
  const glassCard = {
    borderRadius: 4, // Slightly more rounded
    p: 2,
    border: '1px solid #E2E8F0', // Added border for consistency
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    transition: "all 0.25s",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
    },
  };

  const kpiColors = [
    "linear-gradient(135deg,#00509d,#ff8a50)",
    "linear-gradient(135deg,#3B82F6,#60A5FA)",
    "linear-gradient(135deg,#10B981,#34D399)",
    "linear-gradient(135deg,#8B5CF6,#A78BFA)",
  ];

  // =========================
  // INSIGHT FORMAT
  // =========================
  const renderInsight = (text: string) => {
    const InsightItem = ({ text }: { text: string }) => {
      // Este regex irá dividir a string por partes em negrito (**) ou entre aspas (""), mantendo os delimitadores.
      // Ele cria um array de strings, onde as partes em negrito/aspas são elementos separados.
      const parts = text.split(/(\*\*.*?\*\*)|(".*?")/g).filter(Boolean);
  
      return (
        <Typography variant="body2" sx={{ color: darkGray, lineHeight: 1.6 }}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              // É uma parte em negrito
              return (
                <Typography key={i} component="span" sx={{ fontWeight: 900, color: darkGray }}>
                  {part.slice(2, -2)}
                </Typography>
              );
            }
            if (part.startsWith('"') && part.endsWith('"')) {
              // É uma parte entre aspas (um nome)
              return (
                <Typography component="span" key={i} sx={{ fontWeight: 700, color: marconBlue, bgcolor: `${marconBlue}1A`, px: 0.5, borderRadius: 1 }}>
                  {part.slice(1, -1)}
                </Typography>
              );
            }
            // É uma parte de texto normal
            return part;
          })}
        </Typography>
      );
    };

    const sections: { title: string; icon: string; color: string; content: string[] }[] = [];
    let currentSection: { title: string; icon: string; color: string; content: string[] } | null = null;

    const lines = text?.split('\n').filter(Boolean) || [];

    const sectionMappings: { [key: string]: { icon: string; color: string } } = {
        'PROBLEMAS CRÍTICOS IMEDIATOS': { icon: '🔴', color: '#DC2626' },
        'RISCOS (24–72h)': { icon: '⚠️', color: '#F59E0B' },
        'INEFICIÊNCIAS OPERACIONAIS': { icon: '📉', color: '#3B82F6' },
        'AÇÕES RECOMENDADAS': { icon: '✅', color: '#16A34A' },
        'INSIGHT ESTRATÉGICO': { icon: '🧠', color: darkGray },
    };

    lines.forEach(line => {
        if (line.startsWith('### ')) {
            if (currentSection) sections.push(currentSection);
            
            const title = line.replace('###', '').replace(/🔴|⚠️|📉|✅|🧠/g, '').trim();
            const mapping = sectionMappings[title];

            if (mapping) {
                currentSection = { title, icon: mapping.icon, color: mapping.color, content: [] };
            } else {
                currentSection = null;
            }
        } else if (currentSection && (line.trim().startsWith('-') || line.trim().startsWith('*'))) {
            currentSection.content.push(line.trim().replace(/^- |^\* /, ''));
        }
    });

    if (currentSection) sections.push(currentSection);

    return (
        <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 2 }}>
            <Stack spacing={3}>
                {sections.map((section, index) => (
                    <Box key={index}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: section.color, display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            {section.icon} {section.title}
                        </Typography>
                        <Stack spacing={1}>
                            {section.content.map((item, itemIndex) => (
                                <Paper key={itemIndex} variant="outlined" sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #F1F5F9' }}>
                                    <InsightItem text={item} />
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
  };

  // =========================
  // EXPORT MODAL HANDLERS
  // =========================
  const handleOpenExportModal = () => {
    setExportStartDate(''); // Initialize with empty dates for full export by default
    setExportEndDate('');
    setExportModalOpen(true);
  };

  const handleCloseExportModal = () => {
    setExportModalOpen(false);
  };

  // =========================
  // EXPORTAÇÃO EXCEL / POWER BI
  // =========================
  const handleExportExcel = async () => {
    if (!data) return;

    const workbook = new ExcelJS.Workbook();
    const now = new Date();
    const dateString = now.toLocaleDateString('pt-BR').replace(/\//g, '_'); // DD_MM_YYYY
    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, ''); // HHMM
    const fileName = `Dashboard_Operacional_Marcon_${dateString}_${timeString}.xlsx`;

    // ==========================================
    // ABA 1: DASHBOARD VISUAL (O "UAU" DO EXCEL)
    // ==========================================
    const wsDash = workbook.addWorksheet('📊 Painel Visual', { views: [{ showGridLines: false }] }); // Oculta as linhas de grade para um visual mais limpo
    
    // --- Cabeçalho do Relatório ---
    wsDash.mergeCells('A1:E2'); // Increased to E to accommodate more visual elements
    const title = wsDash.getCell('A1');
    title.value = 'DASHBOARD OPERACIONAL - MARCON';
    title.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00509d' } };
    title.alignment = { vertical: 'middle', horizontal: 'center' };

    wsDash.mergeCells('A3:E3');
    const subtitle = wsDash.getCell('A3');
    subtitle.value = `Relatório Gerado em: ${now.toLocaleString('pt-BR')}`; // Adiciona data e hora da geração
    subtitle.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
    subtitle.alignment = { vertical: 'middle', horizontal: 'right' };

    // --- Largura das Colunas do Dashboard ---
    wsDash.columns = [ { width: 25 }, { width: 15 }, { width: 30 }, { width: 15 }, { width: 20 } ]; // Adjusted widths

    // --- KPIs Gigantes ---
    wsDash.mergeCells('A5:A6'); wsDash.mergeCells('B5:B6'); wsDash.mergeCells('C5:C6'); wsDash.mergeCells('D5:D6'); // Mescla células para cada KPI
    
    const kpis = [
      { label: 'DISPONÍVEIS', value: data?.estoque?.disponivel || 0, color: 'FF10B981' }, // Green
      { label: 'EM USO', value: data?.status?.em_uso || 0, color: 'FF3B82F6' }, // Blue
      { label: 'EM MANUTENÇÃO', value: data?.status?.manutencao || 0, color: 'FF00509d' }, // Orange
      { label: 'MOVIMENTAÇÕES TOTAIS', value: data?.status?.total_movimentacoes || 0, color: 'FF8B5CF6' }, // Purple
    ];

    // Estilo dos KPIs
    let colIndex = 1;
    kpis.forEach(kpi => {
      const headerCell = wsDash.getCell(5, colIndex);
      headerCell.value = kpi.label;
      headerCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.color } };
      headerCell.alignment = { vertical: 'middle', horizontal: 'center' };

      const valueCell = wsDash.getCell(6, colIndex);
      valueCell.value = kpi.value;
      valueCell.font = { bold: true, size: 20, color: { argb: 'FF1A1C1E' } };
      valueCell.alignment = { vertical: 'middle', horizontal: 'center' };
      valueCell.border = { bottom: { style: 'thick', color: { argb: 'FFE2E8F0' } } };
      colIndex++;
    });

    // --- Espaço ---
    wsDash.addRow([]); // Row 7
    wsDash.addRow([]); // Row 8

    // --- Gráfico de Pizza (Simulado) - Distribuição de Status ---
    wsDash.mergeCells('A9:B9'); // Título para o "gráfico de pizza"
    wsDash.getCell('A9').value = '🍕 DISTRIBUIÇÃO DE ATIVOS';
    wsDash.getCell('A9').font = { bold: true, size: 12, color: { argb: 'FF1A1C1E' } };
    wsDash.getCell('A9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    wsDash.getCell('A9').alignment = { horizontal: 'center' };

    const totalAtivos = (data?.estoque?.disponivel || 0) + (data?.status?.em_uso || 0) + (data?.status?.manutencao || 0);
    const statusData = [
      { label: 'Disponíveis', value: data?.estoque?.disponivel || 0, color: 'FF10B981' },
      { label: 'Em Uso', value: data?.status?.em_uso || 0, color: 'FF3B82F6' },
      { label: 'Em Manutenção', value: data?.status?.manutencao || 0, color: 'FF00509d' },
    ];

    let currentRow = 10;
    statusData.forEach(item => {
      const percentage = totalAtivos > 0 ? (item.value / totalAtivos) * 100 : 0;
      wsDash.getCell(`A${currentRow}`).value = item.label; // Legenda do item
      wsDash.getCell(`A${currentRow}`).font = { bold: true, color: { argb: item.color } };
      wsDash.getCell(`B${currentRow}`).value = `${percentage.toFixed(1)}%`; // Porcentagem
      wsDash.getCell(`B${currentRow}`).font = { bold: true };
      currentRow++;
    });

    // --- Espaço --- (para separar os blocos visuais)
    wsDash.addRow([]); // After pie chart simulation

    // --- Gráfico de Barras in-line: Top Operadores ---
    wsDash.mergeCells(`A${currentRow}:C${currentRow}`);
    wsDash.getCell(`A${currentRow}`).value = '🏆 TOP OPERADORES';
    wsDash.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FF3B82F6' } };
    wsDash.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    wsDash.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    currentRow++;
    
    const opData = data?.metricas?.funcionariosTop || [];
    const maxOp = opData.length > 0 ? Math.max(...opData.map((d: any) => d.total)) : 1;
    
    opData.forEach((item: any) => {
      const barLength = Math.round((item.total / maxOp) * 20); // Max 20 blocks for visual bar
      wsDash.getCell(`A${currentRow}`).value = item.nome; // Nome do operador
      wsDash.getCell(`B${currentRow}`).value = item.total; // Total de movimentações
      wsDash.getCell(`C${currentRow}`).value = '█'.repeat(barLength); // Barra visual
      wsDash.getCell(`C${currentRow}`).font = { color: { argb: 'FF3B82F6' } }; 
      currentRow++;
    });

    // --- Espaço --- (para separar os blocos visuais)
    wsDash.addRow([]); 
    currentRow++;

    // --- Gráfico de Barras in-line: Top Ferramentas ---
    wsDash.mergeCells(`A${currentRow}:C${currentRow}`);
    wsDash.getCell(`A${currentRow}`).value = '🔧 TOP FERRAMENTAS';
    wsDash.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FF00509d' } };
    wsDash.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    wsDash.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    currentRow++;

    const ferData = data?.metricas?.ferramentasTop || [];
    const maxFer = ferData.length > 0 ? Math.max(...ferData.map((d: any) => d.total)) : 1;
    
    ferData.forEach((item: any) => {
      const barLength = Math.round((item.total / maxFer) * 20);
      wsDash.getCell(`A${currentRow}`).value = item.descricao; // Descrição da ferramenta
      wsDash.getCell(`B${currentRow}`).value = item.total; // Total de movimentações
      wsDash.getCell(`C${currentRow}`).value = '█'.repeat(barLength); // Barra visual
      wsDash.getCell(`C${currentRow}`).font = { color: { argb: 'FF00509d' } };
      currentRow++;
    });

    // --- AI Insights ---
    wsDash.addRow([]);
    currentRow++;
    wsDash.mergeCells(`A${currentRow}:E${currentRow}`); // Título para os insights
    wsDash.getCell(`A${currentRow}`).value = '🧠 INSIGHTS DA IA';
    wsDash.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FF1A1C1E' } };
    wsDash.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    wsDash.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    currentRow++;

    if (insight) {
      insight.split("\n").filter(Boolean).forEach((line: string) => {
        let bgColor = 'FFFFFFFF'; // Default white
        if (line.includes("🔴")) bgColor = 'FFFEE2E2'; // Light Red
        if (line.includes("⚠️")) bgColor = 'FFFFF3C7'; // Light Yellow
        if (line.includes("📉")) bgColor = 'FFDBEAFE'; // Light Blue
        if (line.includes("✅")) bgColor = 'FFDCFCE7'; // Light Green

        wsDash.mergeCells(`A${currentRow}:E${currentRow}`); // Mescla para o texto do insight
        const insightCell = wsDash.getCell(`A${currentRow}`);
        insightCell.value = line;
        insightCell.font = { size: 10 };
        insightCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        insightCell.border = { left: { style: 'thin', color: { argb: 'FF00509d' } } }; // Left border for emphasis
        insightCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        currentRow++;
      });
    } else {
      wsDash.mergeCells(`A${currentRow}:E${currentRow}`); // Mescla para a mensagem de "sem insights"
      wsDash.getCell(`A${currentRow}`).value = 'Nenhum insight disponível no momento.';
      wsDash.getCell(`A${currentRow}`).font = { italic: true, color: { argb: 'FF64748B' } };
      currentRow++;
    }


    // ==========================================
    // ABA 2: DADOS BRUTOS - TIMELINE
    // ==========================================
    const wsTimeline = workbook.addWorksheet('Tabela - Timeline 7 Dias');
    wsTimeline.columns = [
      { header: 'Data', key: 'dia', width: 20 },
      { header: 'Total de Movimentações', key: 'total', width: 25 }
    ];
    // Apply date filter to timeline data
    const filteredTimeline = (data?.timeline || []).filter((item: any) => {
      if (!exportStartDate && !exportEndDate) return true;
      const itemDate = new Date(item.dia); // Assuming item.dia is 'YYYY-MM-DD'
      if (exportStartDate && itemDate < new Date(exportStartDate + 'T00:00:00')) return false;
      if (exportEndDate && itemDate > new Date(exportEndDate + 'T23:59:59')) return false;
      return true;
    });
    filteredTimeline.forEach((item: any) => wsTimeline.addRow(item));

    // ==========================================
    // ABA 3: DADOS BRUTOS - TOP OPERADORES
    // ==========================================
    const wsOperadores = workbook.addWorksheet('Tabela - Top Operadores');
    wsOperadores.columns = [
      { header: 'Operador', key: 'nome', width: 30 },
      { header: 'Total Movimentações', key: 'total', width: 25 }
    ];
    (data?.metricas?.funcionariosTop || []).forEach((item: any) => wsOperadores.addRow(item));

    // ==========================================
    // ABA 4: DADOS BRUTOS - TOP FERRAMENTAS
    // ==========================================
    const wsFerramentas = workbook.addWorksheet('Tabela - Top Ferramentas');
    wsFerramentas.columns = [
      { header: 'Ferramenta', key: 'descricao', width: 40 },
      { header: 'Total Movimentações', key: 'total', width: 25 }
    ];
    (data?.metricas?.ferramentasTop || []).forEach((item: any) => wsFerramentas.addRow(item));


    // --- Estilizar cabeçalhos das tabelas de dados brutos ---
    workbook.worksheets.forEach((ws: ExcelJS.Worksheet) => { // Tipagem explícita para 'ws'
      if (ws.name.startsWith('Tabela - ')) { // Apply only to raw data tables
        ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00509d' } };
        ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName); // 'fileName' está no escopo correto
    handleCloseExportModal(); // Close modal after export
  };

  return (
    <Box sx={{ p: 3, background: "#F8FAFC", minHeight: "100vh" }}>

      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{ bgcolor: marconBlue, color: 'white', width: 56, height: 56, borderRadius: 3, boxShadow: '0 4px 15px rgba(0, 80, 157, 0.3)' }}>
            <DashboardIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, color: darkGray, letterSpacing: '-2px' }}>
              Dashboard <span style={{ color: marconBlue }}>Operacional</span>
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#64748B', fontWeight: 500, mt: 0.5 }}>
              Copiloto industrial em tempo real
            </Typography>
          </Box>
        </Box>
        <Button 
          variant="outlined"
          onClick={handleOpenExportModal}
          startIcon={<FileDownloadIcon />}
          sx={{ 
            borderRadius: 3, fontWeight: 800, color: "#1A1C1E", borderColor: '#E2E8F0', 
            textTransform: 'none', px: 3, py: 1.5, bgcolor: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' }
          }}
        >
        Gerar Relatório Inteligente (Excel)
        </Button>
      </Box>

      {/* ========================= KPI ========================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(4,1fr)" },
          gap: 2,
          mt: 3,
        }}
      >
        {[
          { label: "Disponíveis", value: data?.estoque?.disponivel },
          { label: "Em Uso", value: data?.status?.em_uso },
          { label: "Manutenção", value: data?.status?.manutencao },
          { label: "Movimentações", value: data?.status?.total_movimentacoes },
        ].map((item, i) => (
          <Card
            key={i}
            sx={{
              ...glassCard,
              background: kpiColors[i],
              color: "white",
            }}
          >
            <CardContent>
              <Typography sx={{ fontSize: 14 }}>{item.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                {item.value ?? 0}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ========================= LINE CHART ========================= */}
      <Box sx={{ mt: 4, p: 2, background: "white", borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <Typography sx={{ fontWeight: 800, color: darkGray, mb: 2 }}>📈 Movimentações (7 dias)</Typography>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data?.timeline || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="dia" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip 
              contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
              labelStyle={{ fontWeight: 700, color: darkGray }}
              itemStyle={{ color: marconBlue, fontWeight: 600 }}
            />
            <Line type="monotone" dataKey="total" stroke={marconBlue} strokeWidth={3} dot={{ r: 6, fill: marconBlue }} activeDot={{ r: 8, fill: marconBlue, stroke: 'white', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* ========================= OPERADORES ========================= */}
      <Box sx={{ mt: 4, p: 2, background: "white", borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <Typography sx={{ fontWeight: 800, color: darkGray, mb: 2 }}>👷 Top Operadores</Typography>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data?.metricas?.funcionariosTop || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="nome" stroke="#94A3B8" angle={-25} textAnchor="end" height={80} />
            <YAxis stroke="#94A3B8" />
            <Tooltip 
              contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
              labelStyle={{ fontWeight: 700, color: darkGray }}
              itemStyle={{ color: '#3B82F6', fontWeight: 600 }}
            />
            <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* ========================= FERRAMENTAS ========================= */}
      <Box sx={{ mt: 4, p: 2, background: "white", borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <Typography sx={{ fontWeight: 800, color: darkGray, mb: 2 }}>🔧 Ferramentas mais usadas</Typography>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data?.metricas?.ferramentasTop || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="descricao" stroke="#94A3B8" angle={-25} textAnchor="end" height={80} />
            <YAxis stroke="#94A3B8" />
            <Tooltip 
              contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
              labelStyle={{ fontWeight: 700, color: darkGray }}
              itemStyle={{ color: marconBlue, fontWeight: 600 }}
            />
            <Bar dataKey="total" fill={marconBlue} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* ========================= IA ========================= */}
      <Box sx={{ mt: 5 }}>
        <Card sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <Typography sx={{ fontWeight: 900, color: darkGray }}>🧠 IA Copiloto Industrial</Typography>
          <Divider sx={{ my: 2 }} />

          {loadingAI ? (
            <Typography sx={{ color: '#64748B' }}>Gerando análise estratégica...</Typography>
          ) : (
            renderInsight(insight)
          )}
        </Card>
      </Box>

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
          Opções de Exportação
        </DialogTitle>
        <DialogContent sx={{ p: 4, pt: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: darkGray, mb: 1 }}>
            Filtrar Timeline por Período:
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
          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mt: 0.5 }}>
            * Os KPIs e Top Operadores/Ferramentas serão exportados com os dados atuais do dashboard.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2, justifyContent: 'center', gap: 2 }}>
          <Button onClick={handleCloseExportModal} variant="outlined" sx={{ fontWeight: 800, px: 4, py: 1.5, borderRadius: 3, textTransform: 'none', fontSize: '1rem', borderColor: '#E2E8F0', color: darkGray, '&:hover': { borderColor: marconBlue, color: marconBlue } }}>Cancelar</Button>
          <Button onClick={handleExportExcel} variant="contained" startIcon={<FileDownloadIcon />} sx={{ bgcolor: marconBlue, color: 'white', fontWeight: 800, px: 4, py: 1.5, borderRadius: 3, boxShadow: `0 4px 15px ${marconBlue}40`, textTransform: 'none', fontSize: '1rem', '&:hover': { bgcolor: '#003a70', transform: 'translateY(-2px)' }, transition: 'all 0.3s' }}>Confirmar Exportação</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}