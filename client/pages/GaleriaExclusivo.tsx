import GaleriaPlano from "@/components/GaleriaPlano";

export default function GaleriaExclusivo() {
  return (
    <GaleriaPlano
      planoRequerido="exclusivo"
      etiquetaFiltro="Exclusivo"
      titulo="Galeria Exclusiva"
      corPrimaria="#ec4899"
      corGradiente="linear-gradient(135deg,#1a0830 0%,#2d0a4e 50%,#0a0f1e 100%)"
    />
  );
}
