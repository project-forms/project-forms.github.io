import {
  ActionList,
  ActionMenu,
  Avatar,
  Header,
  IconButton,
  StyledOcticon,
} from "@primer/react";
import { TableIcon } from "@primer/octicons-react";
import useAuthState from "../hooks/use-auth-state";

export default function Nav() {
  const { authState, logout } = useAuthState();

  return (
    <Header>
      <Header.Item full>
        <Header.Link href="https://github.com/project-forms">
          <StyledOcticon icon={TableIcon} size={32} sx={{ mr: 2 }} />
          <span>Project Forms</span>
        </Header.Link>
      </Header.Item>
      {authState.user?.avatar_url && (
        <Header.Item>
          <ActionMenu>
            <ActionMenu.Anchor>
              <IconButton
                sx={{ p: 0 }}
                icon={() => (
                  <Avatar src={authState.user.avatar_url} size={32} />
                )}
                variant="invisible"
              />
            </ActionMenu.Anchor>

            <ActionMenu.Overlay>
              <ActionList onClick={logout}>
                <ActionList.Item>Sign Out</ActionList.Item>
              </ActionList>
            </ActionMenu.Overlay>
          </ActionMenu>
        </Header.Item>
      )}
    </Header>
  );
}
