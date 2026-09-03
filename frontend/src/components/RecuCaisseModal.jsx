import {
  FaPrint,
  FaReceipt,
  FaCheckCircle,
  FaClinicMedical,
  FaShieldAlt,
  FaUser,
  FaCalendarAlt,
  FaCoins,
} from 'react-icons/fa'
import { formatDateTime } from '../utils/dateUtils'
import './RecuCaisseModal.css'

export default function RecuCaisseModal({ versement, onClose }) {
  if (!versement) return null

  const handlePrint = () => {
    window.print()
  }

  const dateFormatee = formatDateTime(versement.dateVersement)

  return (
    <div className="recu-modal-wrap">
      <div className="recu-print-card" id="printable-recu">
        {/* En-tête officiel */}
        <div className="recu-header">
          <div className="recu-brand">
            <div className="recu-brand-title">
              <FaClinicMedical className="recu-logo" /> AlphaMedPro
            </div>
            <div className="recu-brand-sub">Clinique Médicale & Centre Hospitalier</div>
            <div className="recu-brand-contact">Service de Caisse & Facturation Centrale</div>
          </div>

          <div className="recu-doc-info">
            <div className="recu-title-badge">REÇU DE CAISSE OFFICIEL</div>
            <div className="recu-num-highlight">{versement.numeroVersement}</div>
            <div className="recu-date-line">
              <FaCalendarAlt className="mini-icon" /> Date & Heure : {dateFormatee}
            </div>
          </div>
        </div>

        <div className="recu-divider" />

        {/* Coordonnées Patient & Visite */}
        <div className="recu-grid-2col">
          <div className="recu-box">
            <div className="recu-box-title">
              <FaUser /> Informations Patient
            </div>
            <div className="recu-box-row">
              <span className="lbl">Patient :</span>
              <strong className="val">
                {versement.patientPrenom} {versement.patientNom}
              </strong>
            </div>
            {versement.patientNumeroDossier && (
              <div className="recu-box-row">
                <span className="lbl">N° Dossier :</span>
                <span className="val monospace">{versement.patientNumeroDossier}</span>
              </div>
            )}
            {versement.patientCode && (
              <div className="recu-box-row">
                <span className="lbl">N° Carte :</span>
                <span className="val monospace">{versement.patientCode}</span>
              </div>
            )}
            {versement.patientTelephone && (
              <div className="recu-box-row">
                <span className="lbl">Téléphone :</span>
                <span className="val">{versement.patientTelephone}</span>
              </div>
            )}
          </div>

          <div className="recu-box">
            <div className="recu-box-title">
              <FaReceipt /> Référence Visite & Caisse
            </div>
            <div className="recu-box-row">
              <span className="lbl">N° Visite :</span>
              <strong className="val monospace text-purple">{versement.numeroVisite}</strong>
            </div>
            <div className="recu-box-row">
              <span className="lbl">Mode de paiement :</span>
              <span className="val recu-mode-badge">{versement.modePaiement}</span>
            </div>
            {versement.referencePaiement && (
              <div className="recu-box-row">
                <span className="lbl">Réf. transaction :</span>
                <span className="val monospace">{versement.referencePaiement}</span>
              </div>
            )}
            <div className="recu-box-row">
              <span className="lbl">Caissier(e) :</span>
              <span className="val">{versement.caissier || 'Caisse Principale'}</span>
            </div>
          </div>
        </div>

        {/* Tableau des lignes imputées */}
        {versement.lignes && versement.lignes.length > 0 && (
          <div className="recu-table-section">
            <div className="recu-section-title">Détail des Soins & Actes Réglés</div>
            <table className="recu-table">
              <thead>
                <tr>
                  <th>N° Sous-Facture</th>
                  <th>Catégorie de Soins</th>
                  <th className="text-right">Remise</th>
                  <th className="text-right">Montant Réglé</th>
                </tr>
              </thead>
              <tbody>
                {versement.lignes.map((l) => (
                  <tr key={l.id}>
                    <td className="monospace font-bold">{l.numeroSousFacture}</td>
                    <td>{l.libelleCategorie}</td>
                    <td className="text-right">
                      {Number(l.remiseImputee || 0) > 0
                        ? `-${Number(l.remiseImputee).toLocaleString()} F`
                        : '-'}
                    </td>
                    <td className="text-right font-bold text-green">
                      {Number(l.montantImpute || 0).toLocaleString()} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Synthèse Financière du Versement */}
        <div className="recu-financial-summary">
          {Number(versement.remise || 0) > 0 && (
            <div className="recu-sum-row">
              <span>Remise exceptionnelle accordée :</span>
              <strong className="text-orange">
                -{Number(versement.remise).toLocaleString()} FCFA
              </strong>
            </div>
          )}

          <div className="recu-sum-row highlight-row">
            <span>MONTANT ENCAISSÉ / REÇU :</span>
            <strong className="recu-big-amount">
              {Number(versement.montantVerse).toLocaleString()} FCFA
            </strong>
          </div>

          {Number(versement.monnaieRendue || 0) > 0 && (
            <div className="recu-sum-row">
              <span>Monnaie rendue au patient :</span>
              <strong>{Number(versement.monnaieRendue).toLocaleString()} FCFA</strong>
            </div>
          )}

          <div className="recu-sum-row reste-row">
            <span>Reste à payer sur la visite :</span>
            <strong className={Number(versement.resteAPayer || 0) === 0 ? 'text-green' : 'text-danger'}>
              {Number(versement.resteAPayer || 0) === 0
                ? '0 FCFA (SOLDÉ ✓)'
                : `${Number(versement.resteAPayer).toLocaleString()} FCFA`}
            </strong>
          </div>
        </div>

        {versement.observations && (
          <div className="recu-notes-box">
            <strong>Notes :</strong> {versement.observations}
          </div>
        )}

        {/* Signatures */}
        <div className="recu-signatures-grid">
          <div className="recu-sig-box">
            <span className="sig-label">Signature du Patient / Accompagnateur</span>
            <div className="sig-space" />
          </div>
          <div className="recu-sig-box">
            <span className="sig-label">Cachet & Signature de la Caisse</span>
            <div className="sig-space" />
            <span className="sig-user">{versement.caissier}</span>
          </div>
        </div>

        <div className="recu-footer">
          Merci pour votre confiance — Document officiel délivré par le logiciel AlphaMedPro
        </div>
      </div>

      {/* Barre d'action hors impression */}
      <div className="recu-actions no-print">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Fermer
        </button>
        <button type="button" className="btn btn-primary" onClick={handlePrint}>
          <FaPrint /> Imprimer le reçu
        </button>
      </div>
    </div>
  )
}
