import attach_Basenames_Registrars from "./basenames/handlers/Basenames_Registrar";
import attach_Basenames_RegistrarControllers from "./basenames/handlers/Basenames_RegistrarController";
import attach_Ethnames_Registrars from "./ethnames/handlers/Ethnames_Registrar";
import attach_Ethnames_RegistrarControllers from "./ethnames/handlers/Ethnames_RegistrarController";
import attach_Lineanames_Registrars from "./lineanames/handlers/Lineanames_Registrar";
import attach_Lineanames_RegistrarControllers from "./lineanames/handlers/Lineanames_RegistrarController";

export default function () {
  attach_Ethnames_Registrars();
  attach_Ethnames_RegistrarControllers();

  attach_Basenames_Registrars();
  attach_Basenames_RegistrarControllers();

  attach_Lineanames_Registrars();
  attach_Lineanames_RegistrarControllers();
}
