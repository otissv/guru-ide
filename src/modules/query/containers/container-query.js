import React from 'react';
import axios from 'axios';
import autobind from 'class-autobind';
import { connect } from '../../../store';
import getClassMethods from '../../../helpers/get-class-methods';
import { buildClientSchema, parse, print } from 'graphql';
import cuid from 'cuid';
import { initialState } from '../redux/redux-query';
import { initialState as formsInitialState } from '../../forms/redux/redux-forms';

class GraphiQLContainer extends React.Component {
  constructor () {
    super(...arguments);
    autobind(this);

    this.query = {
      id: null,
      collection: { value: this.props.forms.saveForm.fields.collection.value },
      query: '',
      variables: ''
    };
  }

  componentWillMount () {
    const {
      endpoint,
      createCollections,
      createQueryHistory,
      getGraphqlSchema,
      getQueries,
      setGraphqlSchema,
      setQueryResultsStatus
    } = this.props;

    if (endpoint && endpoint.trim() !== '') {
      // fetch graphql schema
      getGraphqlSchema(endpoint).payload
        .then(response => {
          if (response.data && response.data.__schema) {
            setGraphqlSchema(response.data);
            setQueryResultsStatus('Waiting...');
          }
        })
        .catch(error => console.log(error));

      // fetch queries and history from server
      getQueries().payload
        .then(response => {
          if (response.data.ideQueryFindAll) {
            createCollections(response.data.ideQueryFindAll);
          }

          if (response.data.ideQueryHistoryFindAll) {
            createQueryHistory(response.data.ideQueryHistoryFindAll);
          }
        })
        .catch(error => console.log(error));
    }
  }

  buildSchema () {
    if (this.props.introspection.__schema) {
      return buildClientSchema(this.props.introspection);
    } else {
      return null;
    }
  }

  fetcher (graphQLParams) {
    if (graphQLParams.query === '') {
      return Promise.resolve('Please provide a query.');
    } else {
      const {
        endpoint,
        addQueryHistoryItem,
        setSelectedQuery,
        saveQueryHistory,
        selectedQuery
      } = this.props;

      // axios defaults
      axios.defaults.baseURL = endpoint;
      axios.defaults.headers.post['Content-Type'] =
        'application/x-www-form-urlencoded';

      const axiosConfig = {
        url: endpoint,
        method: 'POST'
      };

      const startResponseTime = new Date().getTime();

      return axios({
        ...axiosConfig,
        data: graphQLParams
      })
        .then(response => {
          const results = {
            request: {
              data: response.config.data,
              headers: response.config.headers,
              method: 'POST',
              url: response.config.url,
              xsrfCookieName: response.config.xsrfCookieName,
              xsrfHeaderName: response.config.xsrfHeaderName
            },

            headers: response.headers,
            status: `${response.status} ${response.statusText}`,
            time: `${new Date().getTime() - startResponseTime}`,
            response: response.data
          };

          const history = {
            query: graphQLParams.query,
            response: results.response.data,
            variables: graphQLParams.variables
          };

          const date = Date.parse(new Date());

          setSelectedQuery({
            ...selectedQuery,
            ...this.query,
            query: graphQLParams.query,
            results
          });

          addQueryHistoryItem({
            [date]: history
          });
          saveQueryHistory({
            [date]: history
          });

          return response.data.data;
        })
        .catch(error => {
          if (error.response) {
            // Response status code 2xx
            this.setState({
              response: error.response.data,
              status: `${error.response.status} failed`,
              headers: error.response.headers
            });
          } else if (error.request) {
            // No response was received
            console.log(error.request);
          }
        });
    }
  }

  handleClickPrettify (event) {
    const { setSelectedQuery, selectedQuery } = this.props;

    const query =
      this.query.query.trim() !== ''
        ? this.query.query.trim()
        : selectedQuery.query;

    const prettyText = this.prettyQuery(query);
    setSelectedQuery({
      ...selectedQuery,
      query: prettyText
    });
  }

  handelOnEditQuery (query) {
    this.query.query = query;
  }

  handelOnEditVariables (variables) {
    this.query.variables = variables;
  }

  handleChangeCollection (selectObject) {
    this.query.collection = selectObject;
    this.forceUpdate();
  }

  handleChangeInputCollection (selectObject) {
    this.query.collection = selectObject;
    this.forceUpdate();
  }

  handleClickRest () {
    this.query = {
      id: null,
      collection: { value: '' },
      query: '',
      variables: ''
    };

    this.props.selectedQueryToInitialState();
    this.forceUpdate();
    this.props.resetForm('saveForm');
  }

  openSaveModel () {
    this.props.setForms({
      saveForm: {
        ...formsInitialState.forms.saveForm,
        fields: {
          ...formsInitialState.forms.saveForm.fields,
          name: { value: this.props.selectedQuery.name },
          collection: this.query.collection
        }
      }
    });

    this.props.setSaveModal(true);
  }

  handleClickSave (values) {
    const {
      addCollection,
      createQuery,
      resetForm,
      selectedQuery,
      setSelectedQuery,
      setSaveModal
    } = this.props;

    const { name, description } = values;

    const data = {
      ...this.query,
      collection: this.query.collection.value,
      description,
      name,
      id: selectedQuery.id || cuid(),
      results: JSON.stringify(selectedQuery.results)
    };

    setSelectedQuery(data);
    addCollection(data);
    createQuery(data).payload
      .then(response => {
        if (response.data.ideQueryCreate.RESULTS_.result === 'failed') {
        }
      })
      .catch(error => console.log(error));
    setSaveModal(false);
    resetForm('saveForm');
  }

  validateSaveModule (data) {
    const errors = {};
    const { name } = data;

    if (
      this.query.collection.value == null ||
      this.query.collection.value.trim() === ''
    ) {
      errors.collection = 'Please enter a collection name';
    }

    if (name == null || name.trim() === '') {
      errors.name = 'Please enter a query name';
    }
    return Object.keys(errors).length !== 0 ? errors : null;
  }

  showSidebarQueryCollection (event) {
    this.props.changeSidebarQueryContent('collection');
  }

  showSidebarQueryHistory (event) {
    this.props.changeSidebarQueryContent('history');
  }

  handleQueryCollectionItemClick (event) {
    if (event.nativeEvent.target.tagName.toUpperCase() === 'BUTTON') return;

    const { queryCollectionAll, selectedQuery, setSelectedQuery } = this.props;
    const target = event.nativeEvent.target;
    const id = target.dataset.kitid;
    const collection =
      target.parentNode.dataset.collection || target.dataset.collection;
    const query = queryCollectionAll[collection][id];

    if (query.id !== selectedQuery.id) {
      this.query = {
        collection: { value: query.collection },
        description: query.description,
        id: query.id,
        name: query.name,
        query: query.query,
        variables: query.variables
      };

      setSelectedQuery({
        ...query,
        results: {
          ...query.results,
          status: 'Waiting...',
          time: null
        }
      });
    } else {
      setSelectedQuery({
        ...query,
        results: initialState.selectedQuery.results
      });
    }
  }

  handleQueryHistoryItemClick (event) {
    const {
      queryHistoryAll,
      initialState,
      setQueryResultsStatus,
      setSelectedQuery
    } = this.props;

    const target = event.nativeEvent.target;
    const id = target.dataset.kitid;
    const history = queryHistoryAll[id];

    const data = {
      ...initialState.query.selectedQuery,
      query: history.query,
      variables: history.variables || '',
      results: {
        ...initialState.query.selectedQuery.results,
        response: history.response
      }
    };

    this.query.query = data.query;
    this.query.variables = data.variables;

    setSelectedQuery(data);
    setQueryResultsStatus('Waiting');
  }

  prettyQuery (query) {
    return print(parse(query));
  }

  render () {
    const { component, gqlTheme, gqlThemePaper, selectedQuery } = this.props;

    const query =
      selectedQuery && selectedQuery.query && selectedQuery.query.trim() !== ''
        ? this.prettyQuery(selectedQuery.query)
        : '';

    const variables = selectedQuery && selectedQuery.variables;
    const Component = component;
    const schema = this.buildSchema();

    const _response =
      JSON.stringify(selectedQuery.results.response, null, 2) || '';
    const response =
      _response.trim() === '' || _response === '{}' || _response === '""'
        ? null
        : _response;

    return (
      <div
        className={`graphiql-theme ${gqlTheme} ${gqlThemePaper ? 'paper' : ''}`}
      >
        <Component
          {...getClassMethods(this)}
          query={query}
          response={response}
          variables={variables}
          schema={schema}
          operationName={null}
          storage={null}
          defaultQuery={null}
          onEditQuery={this.handelOnEditQuery}
          onEditVariables={this.handelOnEditVariables}
          onEditOperationName={null}
          getDefaultFieldNames={null}
          editorTheme={gqlTheme}
          resultTheme={gqlTheme}
          result={selectedQuery.results}
          queryCollection={this.query.collection.value}
        />
      </div>
    );
  }
}

export default connect(GraphiQLContainer);
