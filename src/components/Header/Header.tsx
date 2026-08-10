import { IonHeader } from "@ionic/react";
import { Divider, Modal, TextInput, Button } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { removeTokenGitHub } from "../../store/slices/tokenGitHubSlice";
import ConfirmModal from "../Modals/ConfirmModal";
import useToast from "../../hooks/useToast";
import ModalToken from "../Modals/ModalToken";

export default function Header() {
  const [opened, setOpened] = useState<boolean>(false);
  const [openConfirmModal, setOpenConfirmModal] = useState<boolean>(false);
  const [openModalToken, setOpenModalToken] = useState<boolean>(false);
  const { hasToken, token, loading } = useAppSelector(
    (state) => state.tokenGitHub,
  );
  const dispatch = useAppDispatch();
  const { handleSucessNotification } = useToast();

  return (
    <>
      <IonHeader style={{backgroundColor: "#fff", boxShadow: "none", position: "sticky", top: 0}}>
        <header className="m-2 row justify-content-md-between justify-content-between aling-items-center">
          <div className="col-7 col-sm-6 col-md-6">
            <h1 style={{fontWeight: "bolder", fontSize: "2rem"}}><span style={{fontStyle: "italic", color: "#01214a"}}>Repo</span><span style={{fontStyle: "italic", color: "#ef6d0f"}}>Hound</span></h1>
          </div>
          <div className="col-5 col-sm-6 col-md-6 d-flex justify-content-sm-end justify-content-md-end justify-content-end align-items-center p-0 gap-2">
            <Button variant="outline" color="#eb670d" className="ms-3" onClick={() => window.location.href = 'https://docs.google.com/forms/d/e/1FAIpQLSeiPH1Wk-WrD97xQqvhRMLn2ch3tNcSOOw7z4WxqY9am8j8yg/viewform?usp=dialog'} radius={"md"}>
              Avalie
            </Button>
            <IconSettings
              size={35}
              style={{ cursor: "pointer" }}
              onClick={() => setOpened(true)}
            />
          </div>
        </header>
      </IonHeader>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Configurações"
        centered
        size={"md"}
      >
        <Divider my={"sm"} />
        <div>
          <TextInput disabled label="Seu Token GitHub" value={token || "Nenhum token adicionado"} />
          {hasToken ? (
            <Button
              color="#eb670d"
              className="mt-2"
              fullWidth
              onClick={() => {
                setOpenConfirmModal(true);
                setOpened(false);
              }}
            >
              Remover Token
            </Button>
          ) : (
            <Button
              radius={"md"}
              disabled={hasToken}
              loading={loading}
              color="#eb670d"
              className="mt-2"
              fullWidth
              onClick={() => {
                setOpenModalToken(true);
                setOpened(false);
              }}
            >
              Adicionar Token GitHub
            </Button>
          )}
        </div>
      </Modal>

      <ConfirmModal
        opened={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        title="Confirmação"
        description="Tem certeza que deseja remover seu token do GitHub? Essa ação não pode ser desfeita."
        onConfirm={() => {
          dispatch(removeTokenGitHub());
          setOpenConfirmModal(false);
          handleSucessNotification(
            "Token Removido",
            "Token removido com sucesso!",
          );
        }}
        colorButton="red"
        titleButton="Remover Token"
      />

      <ModalToken
        isOpen={openModalToken}
        onClose={() => setOpenModalToken(false)}
      />
    </>
  );
}
