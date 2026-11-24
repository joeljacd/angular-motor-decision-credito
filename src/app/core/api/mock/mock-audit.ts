import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { NOW } from '../../util/clock';
import { dmyToIso, formatDmyHm } from '../../util/date';
import { HistoryApi, HistoryEntry, HistoryFilter, HistoryFilterOptions, HistoryPage } from '../history.api';
import { ChainLink, IntegrityApi, IntegrityFinding, IntegrityReport } from '../integrity.api';
import { MockBase } from './mock-apis';

@Injectable()
export class MockHistoryApi extends MockBase implements HistoryApi {
  query(filter: HistoryFilter, page: number, size: number): Observable<HistoryPage> {
    return this.respond(() => {
      const text = filter.element?.trim().toLowerCase();
      const rows = this.db.history.filter(
        (r) =>
          (!filter.channel || r.channel === filter.channel) &&
          (!filter.product || r.product === filter.product) &&
          (!filter.version || r.version === filter.version) &&
          (!filter.user || r.user === filter.user) &&
          (!filter.elementType || r.elementType === filter.elementType) &&
          (!text || r.element.toLowerCase().includes(text)) &&
          (!filter.from || dmyToIso(r.timestamp) >= filter.from) &&
          (!filter.to || dmyToIso(r.timestamp) <= filter.to),
      );
      return { items: rows.slice((page - 1) * size, page * size), total: rows.length };
    });
  }

  filterOptions(): Observable<HistoryFilterOptions> {
    return this.respond(() => {
      const uniq = (pick: (r: HistoryEntry) => string) => [...new Set(this.db.history.map(pick).filter((v) => v !== '—'))];
      return {
        channels: uniq((r) => r.channel),
        products: uniq((r) => r.product),
        versions: uniq((r) => r.version).sort(),
        users: uniq((r) => r.user),
        elementTypes: uniq((r) => r.elementType),
      };
    });
  }
}

@Injectable()
export class MockIntegrityApi extends MockBase implements IntegrityApi {
  private readonly auth = inject(AuthService);
  private readonly now = inject(NOW);

  alerts(): Observable<string[]> {
    return this.respond(() => this.db.integrityAlerts);
  }

  lastReport(): Observable<IntegrityReport> {
    return this.respond(() => this.report('bad', 'Última verificación: 22/11/2026 08:00 · automática'));
  }

  verify(scenario: 'bad' | 'ok' = 'bad'): Observable<IntegrityReport> {
    return this.respond(() =>
      this.report(scenario, `Verificación manual: ${formatDmyHm(this.now())} · ${this.auth.me()?.nombre ?? ''}`),
    );
  }

  private report(scenario: 'bad' | 'ok', verifiedAt: string): IntegrityReport {
    if (scenario === 'ok') {
      return { verifiedAt, clean: true, recordsVerified: 1210, sealedVersions: 9, historyFindings: 0, versionFindings: 0, globalSealValid: true, chain: [], findings: [] };
    }
    // Si ya hay una solicitud de sellado pendiente, el hallazgo la referencia en lugar de ofrecer crearla.
    const pending = this.db.requests.find((r) => r.estado === 'Pendiente' && r.tipo === 'Sellado');
    const finding = (f: Partial<IntegrityFinding> & Pick<IntegrityFinding, 'kind' | 'severity' | 'location' | 'detail'>): IntegrityFinding => ({
      sealable: false,
      inHistory: false,
      ...f,
    });
    const chain: ChainLink[] = [1040, 1041, 1042, 1043, 1044, 1045, 1046].map((seq) => ({
      seq,
      status: seq < 1043 ? 'valid' : seq === 1043 ? 'breaks' : 'unverified',
    }));
    return {
      verifiedAt,
      clean: false,
      recordsVerified: 1210,
      sealedVersions: 9,
      historyFindings: 4,
      versionFindings: 2,
      globalSealValid: false,
      chain,
      findings: [
        finding({ kind: 'Registro alterado', severity: 'error', location: 'Historial #1043', detail: 'La firma anterior almacenada no coincide con la firma de #1042.', inHistory: true }),
        finding({ kind: 'Registro borrado', severity: 'error', location: 'Historial #1047 → #1049', detail: 'Falta el registro #1048 en la secuencia.', inHistory: true }),
        finding({ kind: 'Fuera de orden', severity: 'warning', location: 'Historial #1051', detail: 'Marca de tiempo anterior a #1050.', inHistory: true }),
        finding({ kind: 'Campo de auditoría distinto', severity: 'warning', location: 'Historial #1052 · updated_by', detail: 'El valor almacenado difiere del firmado.', inHistory: true }),
        finding({ kind: 'Versión con firma distinta', severity: 'error', location: '2 Agencias / 2 Consumo · v3', detail: 'La firma de la versión no corresponde a su contenido: el motor no evalúa este canal + producto.' }),
        finding({
          kind: 'Versión sin sello', severity: 'warning', location: '2 Agencias / 1 Auto Plan · v1',
          detail: 'Publicada sin sello: el motor no la usa hasta que se selle.', sealable: !pending, pendingRequestId: pending?.id,
        }),
        finding({ kind: 'Sello global inválido', severity: 'error', location: 'Sello global', detail: 'El hash global no coincide con el conjunto de versiones vigentes: el motor no evalúa ningún canal.' }),
      ],
    };
  }
}
