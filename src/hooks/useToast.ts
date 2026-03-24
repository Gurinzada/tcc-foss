import { notifications } from "@mantine/notifications"

export default function useToast(){
    const handleSucessNotification = (title: string, message: string) => {
        notifications.show({
            title: title,
            message: message,
            color: "green",
            autoClose: 5000,
            withCloseButton: true,
        })
    };

    const handleErrorNotification = (title: string, message: string) => {
        notifications.show({
            title: title,
            message: message,
            color: "red",
            autoClose: 5000,
            withCloseButton: true,
        })
    };

    const handleWarnNotification = (title: string, message: string) => {
        notifications.show({
            title: title,
            message: message,
            color: "yellow",
            autoClose: 5000,
            withCloseButton: true,
        })
    };

    const handleInfoNotification = (title:string, message: string) => {
        notifications.show({
            title,
            message,
            color: "dark",
            autoClose: 5000,
            withCloseButton: true
        })
    };

    return { handleSucessNotification, handleErrorNotification, handleWarnNotification, handleInfoNotification }
}