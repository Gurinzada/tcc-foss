import { Card, Divider, Loader } from "@mantine/core";
import { motion } from "framer-motion";
import { AnalysisResult } from "../types/analysis";
import { getScoreColor, getScoreLabel } from "../services/metricsCalculator";
import ScoreGauge from "./ScoreGauge";
import MetricCard from "./MetricCard";
import html2canvas from "html2canvas";
import jsPdf from "jspdf";
import { IconDownload } from "@tabler/icons-react";
import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import useToast from "../hooks/useToast";

interface ScoreDashboardProps {
  result: AnalysisResult;
}

export default function ScoreDashboard({ result }: ScoreDashboardProps) {
  const [isLoadingDownload, setIsLoadingDownload] = useState<boolean>(false);
  const overallColor = getScoreColor(result.overallScore);
  const overallLabel = getScoreLabel(result.overallScore);
  const capacitor = Capacitor.getPlatform();
  const { handleInfoNotification, handleErrorNotification, handleSucessNotification } = useToast();

  const metrics = [
    result.documentation,
    result.taggedIssues,
    result.timeToFirstResponse,
    result.issueHealth,
  ];

  const handleGeneratePdf = async () => {
    setIsLoadingDownload(true);

    try {
      const element = document.getElementById("pdf-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#fff",
        windowWidth: 1024,
        scrollX: 0,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPdf({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const [day, month, year] = new Date()
        .toLocaleDateString("pt-BR")
        .split("/");

      pdf.setFontSize(12);
      pdf.text(
        `RepoHound - Análise de Repositório ${day}/${month}/${year}`,
        5,
        7,
      );
      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);

      if (capacitor === "android" || capacitor === "ios") {
        const permission = await Filesystem.requestPermissions();

        if (permission.publicStorage !== "granted") {
          handleInfoNotification(
            "Permissão negada",
            "Não foi possível salvar o PDF sem permissão de armazenamento.",
          );
          return;
        }

        const pdfBase64 = pdf.output("datauristring").split(",")[1];
        await Filesystem.writeFile({
          path: `${result.repoFullName}_analysis.pdf`,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true
        });
        handleSucessNotification(
          "PDF salvo",
          `O PDF foi salvo com sucesso na pasta de documentos do seu dispositivo.`
        );
        return;
      }

      pdf.save(`${result.repoFullName}_analysis.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      handleErrorNotification("Erro", "Não foi possível gerar o PDF.");
    } finally {
      setIsLoadingDownload(false); 
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="row justify-content-center mt-4 pb-5"
      id="pdf-content"
    >
      <div className="col-12 col-md-10 col-lg-8 mb-4">
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <div className="d-flex flex-column align-items-center gap-3">
            <div className="row justify-content-center aling-items-center w-100">
              <div className="col-4"></div>
              <p
                className="text-muted mb-0 col-4 text-center p-0"
                style={{
                  fontSize: "0.85rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {result.repoFullName}
              </p>
              <div
                onClick={handleGeneratePdf}
                className="col-4 d-flex justify-content-end aling-items-center"
              >
                {isLoadingDownload === false ? (
                  <div
                    className="d-flex downloadButton justify-content-center align-items-center"
                    style={{
                      borderRadius: "50%",
                      width: "35px",
                      height: "35px",
                    }}
                  >
                    <IconDownload size={20} />
                  </div>
                ) : (
                  <Loader size={20} color="#000" />
                )}
              </div>
            </div>

            <ScoreGauge
              score={result.overallScore}
              size={180}
              textSize="32px"
            />

            <div className="text-center">
              <p
                className="fw-bold mb-1"
                style={{ fontSize: "1.3rem", color: overallColor }}
              >
                {overallLabel}
              </p>
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                Score geral baseado em documentação, issues, tempo de resposta e
                saúde do repositório.
              </p>
            </div>

            <div className="d-flex flex-wrap justify-content-center gap-3">
              {metrics.map((m) => (
                <div key={m.title} className="d-flex align-items-center gap-1">
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: getScoreColor(m.score),
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: "0.78rem", color: "#555" }}>
                    {m.title} ({Math.round(m.weight * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Divider
        className="col-12 col-md-10 col-lg-8 mb-3"
        label="Métricas detalhadas"
        labelPosition="center"
      />

      <div className="col-12 col-md-10 col-lg-8">
        <div className="row g-3">
          {metrics.map((metric, i) => (
            <MetricCard key={metric.title} metric={metric} index={i} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
