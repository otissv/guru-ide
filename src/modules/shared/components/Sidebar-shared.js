import React from 'react';
import moment from 'moment';
import styled from 'styled-components';
import Icon from '../../../styled/components/Icon';
import historyIcon from '../../../icons/back-in-time.svg';
import folderIcon from '../../../icons/folder.svg';
import datauri from '../../../styled/datauri';

const Sidebar = styled.div`
  width: 200px;
  position: fixed;
  top: 40px;
  bottom: 30px;
  overflow-y: auto;
  margin-right: 15px;
`;

const CollectionButton = styled.button`
  width: 50%;
  height: 40px;
  border: none;
  outline: none;
  transition: background 0.2s;
  cursor: pointer;
  background: ${props => props.theme.colors.background};
  color: #f1f1f1;
  transition: background ease 0.2s;

  &:hover {
  background: ${props => props.theme.colors.secondary};
}
`;

const HistoryButton = CollectionButton.extend`
  &:before {
    content: '';
    border-bottom: ${props => props.theme.borders.thickPrimary};
    position: absolute;
    top: 38px;
    left: 0;
    width: 50%;
    transform: translateX(0);
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    transition-duration: .3s;
  }
  
  &.Editor-sidebar-button-active:before {
    transform: translateX(100%);
  }
`;

const Info = styled.div`
  padding: 0 20px 20px 20px;
  >p {
    font-size: 13px;
  }

  >pre {
    font-size: 13px;
  }
`;

const List = styled.ul`
  margin: 0;
  padding: 10px 0;
  list-style-type: none;
`;

const ListItem = styled.li`
  padding: 4px 20px;
  transition: background ease 0.2s;

  &:hover {
  background: ${props => props.theme.colors.secondary};
`;

const ListItemLink = styled.a`
  text-decoration: none;
  font-size: 13px;
`;

const AccordionButton = styled.button`
  position: relative;
  border: none;
  background: inherit;
  
  color: ${props => props.theme.colors.foreground};
  width: 100%;
  text-align: left;
  padding: 2px 20px;
  outline: none;
  &:after {
    content: '';
    color: ${props => props.theme.colors.foreground};
    background-repeat: 'no-repeat';
    background-position: '50% 50%';
    position: absolute;
    // background-image: url(${datauri.minus});
    top: 0;
    height: 16px;
    width: 16px;
    right: 0;
  }
`;
const Accordion = styled.ul`
  margin: 0;
  padding: 0;
  list-style-type: none;
}
`;

const AccordionItem = styled.li`
  margin: 0;
  font-size: inherit;
  line-height: 1.4;
  cursor: pointer;
  overflow: hidden;
  cursor: pointer;
  font-size: 13px;
  >ul {
    padding-left: 10px;
  }
`;

export default class EditorSidebar extends React.Component {
  collectionList () {
    const { collections, onCollectionItemClick } = this.props;

    const collectionKeys = Object.keys(collections);
    const queries = items =>
      Object.keys(items).map(key => {
        const item = items[key];

        return (
          <List key={item.id}>
            <ListItem
              href="#"
              onClick={onCollectionItemClick}
              data-kitid={item.id}
              data-collection={item.collection}
            >
              <span data-kitid={item.id} data-collection={item.collection}>
                {item.name}
              </span>
            </ListItem>
          </List>
        );
      });

    return collectionKeys.length === 0
      ? <p style={{ padding: '10px' }}>Save queries to create  collections.</p>
      : collectionKeys.map(key => (
          <AccordionItem key={key} data-collection={key}>
            <AccordionButton>{key}</AccordionButton>
            {queries(collections[key])}
          </AccordionItem>
        ));
  }

  historyList () {
    const { history, onHistoryItemClick } = this.props;

    const historyKeys = Object.keys(history);
    return historyKeys.length === 0
      ? <Info key="info">
          <p>Use the query editor to left to send queries to the server.</p>
          <p>
            Queries typically start with a {`"{"`} character.
            Lines that start with a # are ignored.
          </p>
          <p>An example query might look like:</p>
          <pre>
            {`}
  User {
    id
    firstName
    lastName
  }`}
          </pre>

          <p>
            Keyboard shortcuts:<br /><br />

            Run Query: Ctrl-Enter
            or press the play button
            above the query  editor.<br /><br />

            Auto Complete: Ctrl-Space
            or just start typing.`}
          </p>
        </Info>
      : historyKeys.reverse().map(key => {
        const date = new Date(parseInt(key, 10)).toISOString();

        return (
            <ListItem data-kitid={key} key={key} onClick={onHistoryItemClick}>
              <ListItemLink data-kitid={key}>
                {moment(date).format('LL HH:mm:ss')}
              </ListItemLink>
            </ListItem>
        );
      });
  }

  render () {
    const collections = this.collectionList();
    const history = this.historyList();
    const { type, toggle } = this.props;

    return (
      <Sidebar>
        <CollectionButton
          className={type === 'history' ? 'Editor-sidebar-button-active' : ''}
          data-button="history"
          onClick={toggle}
        >
          <Icon src={historyIcon} />
        </CollectionButton>
        <HistoryButton
          className={
            type === 'collection' ? 'Editor-sidebar-button-active' : ''
          }
          data-button="collection"
          onClick={toggle}
        >
          <Icon src={folderIcon} />
        </HistoryButton>
        <Accordion
          type="side"
          style={{
            display: type === 'collection' ? 'block' : 'none'
          }}
        >
          {collections}
        </Accordion>
        <List
          type="side"
          style={{ display: type === 'history' ? 'block' : 'none' }}
        >
          {history}
        </List>
      </Sidebar>
    );
  }
}
