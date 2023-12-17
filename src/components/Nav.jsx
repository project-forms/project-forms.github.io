import {
  ActionList,
  ActionMenu,
  Avatar,
  Header,
  IconButton,
  StyledOcticon,
} from "@primer/react";
import { TableIcon } from "@primer/octicons-react";

export default function Nav({ avatarUrl, onLogout }) {
  return (
    <Header>
      <Header.Item full>
        <Header.Link href="https://github.com/project-forms">
          <StyledOcticon icon={TableIcon} size={32} sx={{ mr: 2 }} />
          <span>Project Forms</span>
        </Header.Link>
      </Header.Item>
      {avatarUrl && (
        <Header.Item>
          <ActionMenu>
            <ActionMenu.Anchor>
              <IconButton
                sx={{ p: 0 }}
                icon={() => <Avatar src={avatarUrl} size={32} />}
                variant="invisible"
              />
            </ActionMenu.Anchor>

            <ActionMenu.Overlay>
              <ActionList onClick={onLogout}>
                <ActionList.Item>Sign Out</ActionList.Item>
              </ActionList>
            </ActionMenu.Overlay>
          </ActionMenu>
        </Header.Item>
      )}
    </Header>
  );
}
