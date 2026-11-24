import { Observable } from 'rxjs';
import { ActiveState, Profile } from '../auth/auth.models';
import { OptionKey } from '../auth/permissions';

export interface ProfileDraft {
  name: string;
  description: string;
  status: ActiveState;
  opts: OptionKey[];
}

export abstract class ProfilesApi {
  /** GET /profiles */
  abstract list(): Observable<Profile[]>;
  /** POST /profiles */
  abstract create(profile: ProfileDraft): Observable<Profile>;
  /** PUT /profiles/{id} */
  abstract update(id: number, profile: ProfileDraft): Observable<Profile>;
  /** PATCH /profiles/{id}  { estado } */
  abstract setStatus(id: number, status: ActiveState): Observable<Profile>;
}
