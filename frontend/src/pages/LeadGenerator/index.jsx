import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Table,
  Space,
  message,
  Row,
  Col,
  Statistic,
  Tag,
  Popconfirm,
  Typography,
  Alert,
  Spin
} from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  LinkOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  StarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  generateLeads,
  fetchLeads,
  deleteLead,
  fetchLeadStats,
  clearError,
  setSearchFilters,
  selectLeads,
  selectLeadStats,
  selectLeadsPagination,
  selectLeadsLoading,
  selectLeadsError,
  selectLastGeneration
} from '@/redux/leads';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const LeadGenerator = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const leads = useSelector(selectLeads);
  const stats = useSelector(selectLeadStats);
  const pagination = useSelector(selectLeadsPagination);
  const loading = useSelector(selectLeadsLoading);
  const error = useSelector(selectLeadsError);
  const lastGeneration = useSelector(selectLastGeneration);

  useEffect(() => {
    dispatch(fetchLeads());
    dispatch(fetchLeadStats());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleGenerateLeads = async (values) => {
    try {
      const result = await dispatch(generateLeads(values)).unwrap();
      message.success(`Generated ${result.data.leadsGenerated} leads from ${result.data.totalFound} businesses found`);
      dispatch(fetchLeads());
      dispatch(fetchLeadStats());
    } catch (error) {
      // Error is handled by useEffect above
    }
  };

  const handleDeleteLead = async (leadId) => {
    try {
      await dispatch(deleteLead(leadId)).unwrap();
      message.success('Lead deleted successfully');
      dispatch(fetchLeadStats());
    } catch (error) {
      // Error is handled by useEffect above
    }
  };

  const handleSearch = (values) => {
    dispatch(setSearchFilters(values));
    dispatch(fetchLeads(values));
  };

  const handleTableChange = (paginationInfo) => {
    const params = {
      page: paginationInfo.current,
      limit: paginationInfo.pageSize,
      ...searchForm.getFieldsValue()
    };
    dispatch(fetchLeads(params));
  };

  const handleRefresh = () => {
    dispatch(fetchLeads());
    dispatch(fetchLeadStats());
  };

  const columns = [
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          {record.rating && (
            <Space>
              <StarOutlined style={{ color: '#faad14' }} />
              <Text type="secondary">{record.rating} ({record.userRatingsTotal} reviews)</Text>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Contact Info',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.website && (
            <Space>
              <LinkOutlined />
              <a href={record.website} target="_blank" rel="noopener noreferrer">
                Website
              </a>
            </Space>
          )}
          {record.phone && (
            <Space>
              <PhoneOutlined />
              <Text copyable>{record.phone}</Text>
            </Space>
          )}
          {record.address && (
            <Space>
              <EnvironmentOutlined />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.address.length > 50 ? `${record.address.substring(0, 50)}...` : record.address}
              </Text>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Business Types',
      dataIndex: 'businessTypes',
      key: 'businessTypes',
      render: (types) => (
        <Space wrap>
          {types?.slice(0, 3).map((type) => (
            <Tag key={type} color="blue" style={{ fontSize: '11px' }}>
              {type.replace(/_/g, ' ')}
            </Tag>
          ))}
          {types?.length > 3 && <Tag>+{types.length - 3} more</Tag>}
        </Space>
      ),
    },
    {
      title: 'Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Delete this lead?"
          description="This action cannot be undone."
          onConfirm={() => handleDeleteLead(record._id)}
          okText="Yes"
          cancelText="No"
        >
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            loading={loading.delete}
          >
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const businessCategories = [
    { value: 'establishment', label: 'All Businesses' },
    { value: 'store', label: 'Retail Stores' },
    { value: 'restaurant', label: 'Restaurants' },
    { value: 'health', label: 'Healthcare' },
    { value: 'beauty_salon', label: 'Beauty & Wellness' },
    { value: 'gym', label: 'Fitness & Gyms' },
    { value: 'lawyer', label: 'Legal Services' },
    { value: 'real_estate_agency', label: 'Real Estate' },
    { value: 'car_dealer', label: 'Automotive' },
    { value: 'electronics_store', label: 'Electronics' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Lead Generator</Title>
      <Paragraph type="secondary">
        Generate business leads from Google Maps. Search for businesses in specific locations and automatically filter those WITHOUT websites.
      </Paragraph>

      {/* Compliance Notice */}
      <Alert
        message="Google Maps API Compliance"
        description="Powered by Google Maps. Lead data is automatically deleted after 24 hours to comply with Google's terms of service."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={stats.totalLeads}
              loading={loading.stats}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Rating"
              value={stats.averageRating}
              precision={1}
              suffix="★"
              loading={loading.stats}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Title level={5}>Top Business Types</Title>
            <Space wrap>
              {stats.topBusinessTypes.map((item, index) => (
                <Tag key={index} color="geekblue">
                  {item.type?.replace(/_/g, ' ')} ({item.count})
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Lead Generation Form */}
      <Card title="Generate New Leads" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateLeads}
          initialValues={{
            radius: 5,
            category: 'establishment'
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Location"
                name="location"
                rules={[{ required: true, message: 'Please enter a location' }]}
              >
                <Input
                  placeholder="e.g., New York, NY or 40.7128,-74.0060"
                  prefix={<EnvironmentOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Search Radius (km)"
                name="radius"
                rules={[{ required: true, message: 'Please enter search radius' }]}
              >
                <InputNumber
                  min={1}
                  max={50}
                  style={{ width: '100%' }}
                  placeholder="Distance in kilometers"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Business Category"
                name="category"
                rules={[{ required: true, message: 'Please select a category' }]}
              >
                <Select placeholder="Select business type">
                  {businessCategories.map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.generate}
              icon={<SearchOutlined />}
              size="large"
            >
              Generate Leads
            </Button>
          </Form.Item>
        </Form>

        {lastGeneration && (
          <Alert
            message="Last Generation Results"
            description={`Found ${lastGeneration.totalFound} businesses, generated ${lastGeneration.leadsGenerated} leads without websites in ${lastGeneration.searchLocation} (${lastGeneration.searchRadius}km radius)`}
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* Search and Filter */}
      <Card title="Your Leads" extra={
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading.fetch}>
          Refresh
        </Button>
      }>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="search">
            <Input
              placeholder="Search leads..."
              prefix={<SearchOutlined />}
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Search
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={leads}
          rowKey="_id"
          loading={loading.fetch}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} leads`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default LeadGenerator;
