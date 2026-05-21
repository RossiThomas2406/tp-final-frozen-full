import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import LineaProduccionService from '../../../../classes/DTOS/LineaProduccionService';
import { toast } from 'react-hot-toast';

const styles = {
  container: {
    padding: '24px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  table: {
    marginTop: '16px',
  },
  expandedRow: {
    margin: '0 0 0 40px',
    padding: '16px',
    background: '#fafafa',
  },
};

const { Option } = Select;

const LineasProduccion = () => {
  const [lineas, setLineas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [productos, setProductos] = useState({});
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [lineasData, estadosData] = await Promise.all([
        LineaProduccionService.obtenerLineas(),
        LineaProduccionService.obtenerEstados()
      ]);
      setLineas(lineasData || []);
      setEstados(estadosData || []);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      toast.error('Error al cargar los datos de líneas de producción');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const cargarProductosLinea = async (idLinea) => {
    try {
      const productosLinea = await LineaProduccionService.obtenerProductosLinea(idLinea);
      setProductos(prev => ({
        ...prev,
        [idLinea]: productosLinea || []
      }));
    } catch (error) {
      console.error(`Error al cargar productos de la línea ${idLinea}:`, error);
      toast.error('No se pudieron cargar los productos de la línea');
    }
  };

  const handleExpand = (expanded, record) => {
    if (expanded && record && record.id) {
      if (!productos[record.id]) {
        cargarProductosLinea(record.id);
      }
    }
  };

  const mostrarModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        descripcion: record.descripcion,
        id_estado_linea_produccion: record.id_estado_linea_produccion || record.id_estado
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (editingId) {
        await LineaProduccionService.actualizarLinea(editingId, values);
        toast.success('Línea de producción actualizada correctamente');
      } else {
        await LineaProduccionService.crearLinea(values);
        toast.success('Línea de producción creada correctamente');
      }
      
      setModalVisible(false);
      form.resetFields();
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar la línea de producción:', error);
      toast.error(error.response?.data?.message || 'Error al guardar la línea de producción');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await LineaProduccionService.eliminarLinea(id);
      toast.success('Línea de producción eliminada correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar la línea de producción:', error);
      toast.error('No se pudo eliminar la línea de producción');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    const newExpandedRowKeys = [...expandedRowKeys];
    const index = newExpandedRowKeys.indexOf(id);
    
    if (index >= 0) {
      newExpandedRowKeys.splice(index, 1);
    } else {
      newExpandedRowKeys.push(id);
    }
    
    setExpandedRowKeys(newExpandedRowKeys);
  };

  const columns = [
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      width: '40%',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: '25%',
      render: (estado, record) => {
        const displayEstado = estado || record.estado_descripcion || 'Disponible';
        return (
          <Tag color={displayEstado === 'Disponible' || displayEstado === 'Activo' ? 'green' : 'red'}>
            {displayEstado}
          </Tag>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: '35%',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={expandedRowKeys.includes(record.id) ? <DownOutlined /> : <RightOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(record.id);
              if (!productos[record.id] && !expandedRowKeys.includes(record.id)) {
                cargarProductosLinea(record.id);
              }
            }}
          >
            {expandedRowKeys.includes(record.id) ? 'Ocultar productos' : 'Ver productos'}
          </Button>
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: '#1890ff' }} />} 
            onClick={(e) => {
              e.stopPropagation();
              mostrarModal(record);
            }}
            title="Editar"
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              Modal.confirm({
                title: '¿Estás seguro de eliminar esta línea de producción?',
                okText: 'Sí, eliminar',
                okType: 'danger',
                cancelText: 'Cancelar',
                onOk: () => handleDelete(record.id),
              });
            }}
            title="Eliminar"
          />
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record) => {
    const productosLinea = productos[record.id] || [];
    
    return (
      <div style={styles.expandedRow}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Typography.Text strong>Productos vinculados a la línea</Typography.Text>
          <Button 
            type="primary" 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              toast('Función para asociar capacidad de producto pendiente', { icon: 'ℹ️' });
            }}
          >
            Agregar Producto
          </Button>
        </div>
        <Table
          columns={[
            { title: 'ID', dataIndex: 'id_producto', key: 'id_producto', width: '15%' },
            { title: 'Producto', dataIndex: 'producto_nombre', key: 'producto_nombre', width: '50%' },
            { 
              title: 'Capacidad Operativa', 
              dataIndex: 'cant_por_hora', 
              key: 'cant_por_hora', 
              width: '35%',
              render: (cantidad) => `${cantidad || 0} unidades/hora`
            }
          ]}
          dataSource={productosLinea}
          rowKey="id_producto"
          pagination={false}
          size="small"
          bordered
        />
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Líneas de Producción
        </Typography.Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => mostrarModal(null)}
        >
          Agregar Línea
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={lineas}
        rowKey="id"
        loading={loading}
        expandable={{
          expandIcon: () => null,
          expandedRowRender,
          expandedRowKeys,
          onExpand: handleExpand,
          onExpandedRowsChange: (expandedRows) => setExpandedRowKeys(expandedRows),
          expandRowByClick: false,
        }}
        pagination={false}
        style={{ width: '100%' }}
      />

      <Modal
        title={editingId ? 'Editar Línea de Producción' : 'Nueva Línea de Producción'}
        open={modalVisible}
        onOk={handleSubmit}
        confirmLoading={loading}
        onCancel={() => setModalVisible(false)}
        destroyOnHidden // 🚀 MODIFICADO: Purgado atributo deprecado para satisfacción de Antd
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[{ required: true, message: 'Por favor ingrese la descripción' }]}
          >
            <Input placeholder="Ej: Línea de envasado principal" />
          </Form.Item>
          
          <Form.Item
            name="id_estado_linea_produccion"
            label="Estado"
            rules={[{ required: true, message: 'Por favor seleccione un estado' }]}
          >
            <Select placeholder="Seleccione un estado">
              {estados.map(estado => (
                <Option key={estado.id || estado.id_estado_linea_produccion} value={estado.id || estado.id_estado_linea_produccion}>
                  {estado.descripcion}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LineasProduccion;