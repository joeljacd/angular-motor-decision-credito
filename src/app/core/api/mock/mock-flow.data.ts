import { FlowCatalog, FlowDocument, FlowVariable, RequestField } from '../flow.models';

// Datos de demostración del flujo (portados del prototipo). Versión 1 = vigente; el borrador (v2) parte de ella con cambios.

export const MOCK_BASELINE_FLOW: FlowDocument = {
 "stopOnStop": true,
 "from": "15/10/2026",
 "to": "",
 "categories": [
  {
   "code": "1",
   "name": "Información Cliente",
   "order": 1,
   "active": true,
   "stopRule": "inherit",
   "policies": [
    {
     "code": "PA-001A",
     "name": "Condición ciudadano — fallecido",
     "order": 1,
     "active": true,
     "root": {
      "id": "n2",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n1",
        "type": "condition",
        "variable": "CONDICION_CIUDADANO",
        "rule": "FIXED",
        "operator": "<>",
        "value": "FALLECIDO"
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Ciudadano habilitado"
      },
      "fail": {
       "action": "R",
       "code": "101",
       "message": "Ciudadano registrado como fallecido"
      },
      "missing": {
       "action": "E",
       "code": "901",
       "message": "Sin dato de condición ciudadana"
      }
     }
    },
    {
     "code": "PA-002",
     "name": "Nacionalidad",
     "order": 2,
     "active": true,
     "root": {
      "id": "n4",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n3",
        "type": "condition",
        "variable": "NACIONALIDAD",
        "rule": "FIXED",
        "operator": "=",
        "value": "ECUATORIANA"
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Nacionalidad aceptada"
      },
      "fail": {
       "action": "E",
       "code": "102",
       "message": "Nacionalidad requiere evaluación"
      },
      "missing": {
       "action": "E",
       "code": "902",
       "message": "Sin dato de nacionalidad"
      }
     }
    },
    {
     "code": "PA-003",
     "name": "Nivel de estudios",
     "order": 3,
     "active": true,
     "root": {
      "id": "n6",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n5",
        "type": "condition",
        "variable": "NIVEL_ESTUDIOS",
        "rule": "CATALOG",
        "catalog": "NIVELES_ESTUDIO_ACEPTADOS",
        "mode": "belongs"
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Nivel de estudios aceptado"
      },
      "fail": {
       "action": "E",
       "code": "103",
       "message": "Nivel de estudios fuera de política"
      },
      "missing": {
       "action": "E",
       "code": "903",
       "message": "Sin dato de estudios"
      }
     }
    }
   ]
  },
  {
   "code": "2",
   "name": "Información Geográfica",
   "order": 2,
   "active": true,
   "stopRule": "yes",
   "policies": [
    {
     "code": "PA-004",
     "name": "Zona geográfica",
     "order": 1,
     "active": true,
     "root": {
      "id": "n8",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n7",
        "type": "condition",
        "variable": "CANTON",
        "rule": "CATALOG",
        "catalog": "CANTONES_ACEPTADOS",
        "mode": "belongs"
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Zona aceptada"
      },
      "fail": {
       "action": "R",
       "code": "104",
       "message": "Cantón fuera de cobertura"
      },
      "missing": {
       "action": "E",
       "code": "904",
       "message": "Sin dato de cantón"
      }
     }
    }
   ]
  },
  {
   "code": "3",
   "name": "Información Financiera",
   "order": 3,
   "active": true,
   "stopRule": "inherit",
   "policies": [
    {
     "code": "PA-005",
     "name": "UAFE",
     "order": 1,
     "active": true,
     "root": {
      "id": "n10",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n9",
        "type": "condition",
        "variable": "REGISTRO_UAFE",
        "rule": "FIXED",
        "operator": "=",
        "value": "N"
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Sin registro UAFE"
      },
      "fail": {
       "action": "R",
       "code": "105",
       "message": "Cliente con registro UAFE"
      },
      "missing": {
       "action": "E",
       "code": "905",
       "message": "Sin dato UAFE"
      }
     }
    },
    {
     "code": "PA-006",
     "name": "Ingreso dependiente",
     "order": 2,
     "active": true,
     "root": {
      "id": "n13",
      "type": "group",
      "op": "OR",
      "children": [
       {
        "id": "n11",
        "type": "condition",
        "variable": "TIPO_CLIENTE",
        "rule": "FIXED",
        "operator": "=",
        "value": "INDEPENDIENTE"
       },
       {
        "id": "n12",
        "type": "condition",
        "variable": "INGRESO_FAMILIAR",
        "rule": "RANGE",
        "from": "800.00",
        "to": ""
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Ingreso suficiente"
      },
      "fail": {
       "action": "E",
       "code": "106",
       "message": "Ingreso bajo el mínimo"
      },
      "missing": {
       "action": "E",
       "code": "906",
       "message": "Sin dato de ingreso"
      }
     }
    },
    {
     "code": "PA-007",
     "name": "Edad y estabilidad",
     "order": 3,
     "active": true,
     "root": {
      "id": "n18",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n14",
        "type": "condition",
        "variable": "EDAD",
        "rule": "RANGE",
        "from": "21",
        "to": "70"
       },
       {
        "id": "n17",
        "type": "group",
        "op": "OR",
        "children": [
         {
          "id": "n15",
          "type": "condition",
          "variable": "ANTIGUEDAD_LABORAL",
          "rule": "RANGE",
          "from": "1",
          "to": ""
         },
         {
          "id": "n16",
          "type": "condition",
          "variable": "TIPO_CLIENTE",
          "rule": "FIXED",
          "operator": "=",
          "value": "INDEPENDIENTE"
         }
        ]
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Perfil estable"
      },
      "fail": {
       "action": "E",
       "code": "107",
       "message": "Edad o estabilidad fuera de política"
      },
      "missing": {
       "action": "E",
       "code": "907",
       "message": "Sin dato de edad"
      }
     }
    }
   ]
  },
  {
   "code": "4",
   "name": "Información Laboral",
   "order": 4,
   "active": false,
   "stopRule": "no",
   "policies": [
    {
     "code": "PA-008",
     "name": "Actividad económica",
     "order": 1,
     "active": true,
     "root": {
      "id": "n20",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n19",
        "type": "condition",
        "variable": "ACTIVIDAD_ECONOMICA",
        "rule": "CATALOG",
        "catalog": "ACTIVIDADES_ECONOMICAS",
        "mode": "belongs"
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Actividad aceptada"
      },
      "fail": {
       "action": "E",
       "code": "108",
       "message": "Actividad no financiable"
      },
      "missing": {
       "action": "E",
       "code": "908",
       "message": "Sin dato de actividad"
      }
     }
    }
   ]
  }
 ]
};

export const MOCK_DRAFT_FLOW: FlowDocument = {
 "stopOnStop": true,
 "from": "15/10/2026",
 "to": "",
 "categories": [
  {
   "code": "1",
   "name": "Información Cliente",
   "order": 1,
   "active": true,
   "stopRule": "inherit",
   "policies": [
    {
     "code": "PA-001A",
     "name": "Condición ciudadano — fallecido",
     "order": 1,
     "active": true,
     "root": {
      "id": "n2",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n1",
        "type": "condition",
        "variable": "CONDICION_CIUDADANO",
        "rule": "FIXED",
        "operator": "<>",
        "value": "FALLECIDO"
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Ciudadano habilitado"
      },
      "fail": {
       "action": "R",
       "code": "101",
       "message": "Ciudadano registrado como fallecido"
      },
      "missing": {
       "action": "E",
       "code": "901",
       "message": "Sin dato de condición ciudadana"
      }
     }
    },
    {
     "code": "PA-002",
     "name": "Nacionalidad",
     "order": 2,
     "active": true,
     "root": {
      "id": "n4",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n3",
        "type": "condition",
        "variable": "NACIONALIDAD",
        "rule": "FIXED",
        "operator": "=",
        "value": "ECUATORIANA"
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Nacionalidad aceptada"
      },
      "fail": {
       "action": "E",
       "code": "102",
       "message": "Nacionalidad requiere evaluación"
      },
      "missing": {
       "action": "E",
       "code": "902",
       "message": "Sin dato de nacionalidad"
      }
     }
    },
    {
     "code": "PA-003",
     "name": "Nivel de estudios",
     "order": 3,
     "active": true,
     "root": {
      "id": "n6",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n5",
        "type": "condition",
        "variable": "NIVEL_ESTUDIOS",
        "rule": "CATALOG",
        "catalog": "NIVELES_ESTUDIO_ACEPTADOS",
        "mode": "belongs"
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Nivel de estudios aceptado"
      },
      "fail": {
       "action": "E",
       "code": "103",
       "message": "Nivel de estudios fuera de política"
      },
      "missing": {
       "action": "E",
       "code": "903",
       "message": "Sin dato de estudios"
      }
     }
    }
   ]
  },
  {
   "code": "2",
   "name": "Información Geográfica",
   "order": 2,
   "active": true,
   "stopRule": "yes",
   "policies": [
    {
     "code": "PA-004",
     "name": "Zona geográfica",
     "order": 1,
     "active": true,
     "root": {
      "id": "n8",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n7",
        "type": "condition",
        "variable": "CANTON",
        "rule": "CATALOG",
        "catalog": "CANTONES_ACEPTADOS",
        "mode": "belongs"
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Zona aceptada"
      },
      "fail": {
       "action": "R",
       "code": "104",
       "message": "Cantón fuera de cobertura"
      },
      "missing": {
       "action": "E",
       "code": "904",
       "message": "Sin dato de cantón"
      }
     }
    }
   ]
  },
  {
   "code": "3",
   "name": "Información Financiera",
   "order": 3,
   "active": true,
   "stopRule": "inherit",
   "policies": [
    {
     "code": "PA-005",
     "name": "UAFE",
     "order": 1,
     "active": true,
     "root": {
      "id": "n10",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n9",
        "type": "condition",
        "variable": "REGISTRO_UAFE",
        "rule": "FIXED",
        "operator": "=",
        "value": "N"
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Sin registro UAFE"
      },
      "fail": {
       "action": "R",
       "code": "105",
       "message": "Cliente con registro UAFE"
      },
      "missing": {
       "action": "E",
       "code": "905",
       "message": "Sin dato UAFE"
      }
     }
    },
    {
     "code": "PA-006",
     "name": "Ingreso dependiente",
     "order": 2,
     "active": true,
     "root": {
      "id": "n13",
      "type": "group",
      "op": "OR",
      "children": [
       {
        "id": "n11",
        "type": "condition",
        "variable": "TIPO_CLIENTE",
        "rule": "FIXED",
        "operator": "=",
        "value": "INDEPENDIENTE"
       },
       {
        "id": "n12",
        "type": "condition",
        "variable": "INGRESO_FAMILIAR",
        "rule": "RANGE",
        "from": "850.00",
        "to": ""
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Ingreso suficiente"
      },
      "fail": {
       "action": "E",
       "code": "106",
       "message": "Ingreso bajo el mínimo"
      },
      "missing": {
       "action": "E",
       "code": "906",
       "message": "Sin dato de ingreso"
      }
     }
    },
    {
     "code": "PA-007",
     "name": "Edad y estabilidad",
     "order": 3,
     "active": true,
     "root": {
      "id": "n18",
      "type": "group",
      "op": "AND",
      "children": [
       {
        "id": "n14",
        "type": "condition",
        "variable": "EDAD",
        "rule": "RANGE",
        "from": "21",
        "to": "70"
       },
       {
        "id": "n17",
        "type": "group",
        "op": "OR",
        "children": [
         {
          "id": "n15",
          "type": "condition",
          "variable": "SCORE_BURO_V2",
          "rule": "RANGE",
          "from": "650",
          "to": ""
         },
         {
          "id": "n16",
          "type": "condition",
          "variable": "TIPO_CLIENTE",
          "rule": "FIXED",
          "operator": "=",
          "value": "INDEPENDIENTE"
         }
        ]
       }
      ]
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Perfil estable"
      },
      "fail": {
       "action": "E",
       "code": "107",
       "message": "Edad o estabilidad fuera de política"
      },
      "missing": {
       "action": "E",
       "code": "907",
       "message": "Sin dato de edad"
      }
     }
    }
   ]
  },
  {
   "code": "4",
   "name": "Información Laboral",
   "order": 4,
   "active": false,
   "stopRule": "no",
   "policies": [
    {
     "code": "PA-008",
     "name": "Actividad económica",
     "order": 1,
     "active": true,
     "root": {
      "id": "n20",
      "type": "group",
      "op": "AND",
      "children": []
     },
     "results": {
      "pass": {
       "action": "C",
       "code": "000",
       "message": "Actividad aceptada"
      },
      "fail": {
       "action": "E",
       "code": "108",
       "message": "Actividad no financiable"
      },
      "missing": {
       "action": "E",
       "code": "908",
       "message": "Sin dato de actividad"
      }
     }
    }
   ]
  }
 ]
};

export const MOCK_VARIABLES: FlowVariable[] = [
 {
  "code": "CONDICION_CIUDADANO",
  "name": "Condición del ciudadano",
  "type": "TEXT",
  "sensitive": false,
  "origin": "request",
  "path": "customer.citizenStatus"
 },
 {
  "code": "NACIONALIDAD",
  "name": "Nacionalidad",
  "type": "TEXT",
  "sensitive": false,
  "origin": "request",
  "path": "customer.nationality"
 },
 {
  "code": "NIVEL_ESTUDIOS",
  "name": "Nivel de estudios",
  "type": "TEXT",
  "sensitive": false,
  "origin": "request",
  "path": "customer.educationLevel"
 },
 {
  "code": "CANTON",
  "name": "Cantón de residencia",
  "type": "TEXT",
  "sensitive": false,
  "origin": "request",
  "path": "address.canton"
 },
 {
  "code": "REGISTRO_UAFE",
  "name": "Registro UAFE",
  "type": "TEXT",
  "sensitive": true,
  "origin": "request",
  "path": "compliance.uafeFlag"
 },
 {
  "code": "TIPO_CLIENTE",
  "name": "Tipo de cliente",
  "type": "TEXT",
  "sensitive": false,
  "origin": "request",
  "path": "customer.type"
 },
 {
  "code": "INGRESO_FAMILIAR",
  "name": "Ingreso familiar mensual",
  "type": "MONEY",
  "sensitive": true,
  "origin": "request",
  "path": "financial.familyIncome"
 },
 {
  "code": "EDAD",
  "name": "Edad del solicitante",
  "type": "NUMBER",
  "sensitive": false,
  "origin": "calculated",
  "fn": "Edad",
  "field": "customer.birthDate"
 },
 {
  "code": "ANTIGUEDAD_LABORAL",
  "name": "Antigüedad laboral (años)",
  "type": "NUMBER",
  "sensitive": false,
  "origin": "calculated",
  "fn": "Años transcurridos",
  "field": "employment.startDate"
 },
 {
  "code": "ACTIVIDAD_ECONOMICA",
  "name": "Actividad económica",
  "type": "TEXT",
  "sensitive": false,
  "origin": "request",
  "path": "employment.activityCode"
 },
 {
  "code": "FECHA_NACIMIENTO",
  "name": "Fecha de nacimiento",
  "type": "DATE",
  "sensitive": true,
  "origin": "request",
  "path": "customer.birthDate"
 },
 {
  "code": "MONTO_SOLICITADO",
  "name": "Monto solicitado",
  "type": "MONEY",
  "sensitive": false,
  "origin": "request",
  "path": "credit.amount"
 }
];

export const MOCK_CATALOGS: FlowCatalog[] = [
 {
  "code": "NIVELES_ESTUDIO_ACEPTADOS",
  "name": "Niveles de estudio aceptados",
  "items": [
   {
    "code": "SEC",
    "label": "Secundaria",
    "active": true
   },
   {
    "code": "TEC",
    "label": "Técnico / Tecnológico",
    "active": true
   },
   {
    "code": "UNI",
    "label": "Universitario",
    "active": true
   },
   {
    "code": "POS",
    "label": "Posgrado",
    "active": true
   },
   {
    "code": "PRI",
    "label": "Primaria",
    "active": false
   }
  ]
 },
 {
  "code": "CANTONES_ACEPTADOS",
  "name": "Cantones aceptados",
  "items": [
   {
    "code": "0901",
    "label": "Guayaquil",
    "active": true
   },
   {
    "code": "1701",
    "label": "Quito",
    "active": true
   },
   {
    "code": "0101",
    "label": "Cuenca",
    "active": true
   },
   {
    "code": "1301",
    "label": "Portoviejo",
    "active": true
   },
   {
    "code": "0701",
    "label": "Machala",
    "active": true
   },
   {
    "code": "1801",
    "label": "Ambato",
    "active": true
   },
   {
    "code": "0907",
    "label": "Durán",
    "active": true
   },
   {
    "code": "1308",
    "label": "Manta",
    "active": true
   }
  ]
 },
 {
  "code": "ACTIVIDADES_ECONOMICAS",
  "name": "Actividades económicas financiables",
  "items": [
   {
    "code": "G4711",
    "label": "Comercio al por menor",
    "active": true
   },
   {
    "code": "C1071",
    "label": "Elaboración de panadería",
    "active": true
   },
   {
    "code": "H4921",
    "label": "Transporte urbano de pasajeros",
    "active": true
   },
   {
    "code": "A0111",
    "label": "Cultivo de cereales",
    "active": false
   }
  ]
 },
 {
  "code": "PROVINCIAS_RIESGO",
  "name": "Provincias con riesgo elevado",
  "items": []
 }
];

export const MOCK_FIELDS: RequestField[] = [
 {
  "group": "Común",
  "path": "customer.idNumber",
  "type": "TEXT",
  "required": true,
  "format": "",
  "maxLength": 13,
  "catalog": "",
  "sensitive": false,
  "description": "Cédula o RUC del solicitante",
  "example": "0912345678"
 },
 {
  "group": "Común",
  "path": "customer.birthDate",
  "type": "DATE",
  "required": true,
  "format": "MM/dd/yyyy",
  "maxLength": null,
  "catalog": "",
  "sensitive": true,
  "description": "Fecha de nacimiento",
  "example": "04/18/1988"
 },
 {
  "group": "Cliente",
  "path": "customer.citizenStatus",
  "type": "TEXT",
  "required": true,
  "format": "",
  "maxLength": 20,
  "catalog": "",
  "sensitive": false,
  "description": "Condición en Registro Civil",
  "example": "VIVO"
 },
 {
  "group": "Cliente",
  "path": "customer.nationality",
  "type": "TEXT",
  "required": true,
  "format": "",
  "maxLength": 30,
  "catalog": "",
  "sensitive": false,
  "description": "Nacionalidad",
  "example": "ECUATORIANA"
 },
 {
  "group": "Cliente",
  "path": "customer.educationLevel",
  "type": "TEXT",
  "required": false,
  "format": "",
  "maxLength": 3,
  "catalog": "NIVELES_ESTUDIO_ACEPTADOS",
  "sensitive": false,
  "description": "Nivel de estudios",
  "example": "UNI"
 },
 {
  "group": "Cliente",
  "path": "customer.type",
  "type": "TEXT",
  "required": true,
  "format": "",
  "maxLength": 20,
  "catalog": "",
  "sensitive": false,
  "description": "Dependiente o independiente",
  "example": "DEPENDIENTE"
 },
 {
  "group": "Geográfica",
  "path": "address.canton",
  "type": "TEXT",
  "required": true,
  "format": "",
  "maxLength": 4,
  "catalog": "CANTONES_ACEPTADOS",
  "sensitive": false,
  "description": "Código de cantón INEC",
  "example": "0901"
 },
 {
  "group": "Financiera",
  "path": "financial.familyIncome",
  "type": "MONEY",
  "required": true,
  "format": "0.00",
  "maxLength": null,
  "catalog": "",
  "sensitive": true,
  "description": "Ingreso familiar mensual",
  "example": "1250.00"
 },
 {
  "group": "Financiera",
  "path": "compliance.uafeFlag",
  "type": "TEXT",
  "required": true,
  "format": "",
  "maxLength": 1,
  "catalog": "",
  "sensitive": true,
  "description": "Marca en listas UAFE (S/N)",
  "example": "N"
 },
 {
  "group": "Financiera",
  "path": "credit.amount",
  "type": "MONEY",
  "required": true,
  "format": "0.00",
  "maxLength": null,
  "catalog": "",
  "sensitive": false,
  "description": "Monto solicitado",
  "example": "15000.00"
 },
 {
  "group": "Laboral",
  "path": "employment.activityCode",
  "type": "TEXT",
  "required": false,
  "format": "",
  "maxLength": 5,
  "catalog": "ACTIVIDADES_ECONOMICAS",
  "sensitive": false,
  "description": "Código CIIU de la actividad",
  "example": "G4711"
 }
];
