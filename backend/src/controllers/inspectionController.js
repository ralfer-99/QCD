// controllers/inspectionController.js
import Inspection from '../models/inspectionModel.js';
import Defect from '../models/defectModel.js';
import cloudinary from '../config/cloudinary.js';
import { createDefectRateAlert } from './alertController.js';
import fs from 'fs';
import mongoose from 'mongoose';

export const createInspection = async (req, res) => {
    try {
        const { product, batchNumber, notes, totalInspected } = req.body;

        const inspection = await Inspection.create({
            product,
            inspector: req.user._id,
            batchNumber,
            notes,
            totalInspected,
            images: []
        });

        res.status(201).json({ success: true, data: inspection });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const uploadInspectionImages = async (req, res) => {
    try {
        const inspection = await Inspection.findById(req.params.id);
        if (!inspection) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        // Check if files were provided
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please upload at least one image file'
            });
        }

        const uploadedImages = await Promise.all(req.files.map(async file => {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'quality-control/inspections'
            });

            // Clean up the temp file after upload
            try {
                fs.unlinkSync(file.path);
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }

            return {
                url: result.secure_url,
                publicId: result.public_id,
                defectsDetected: false,
                aiConfidence: 0
            };
        }));

        inspection.images.push(...uploadedImages);
        await inspection.save();

        res.status(200).json({ success: true, data: inspection });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getInspections = async (req, res) => {
    try {
        const { product, status, date, inspector } = req.query;
        const queryObj = {};

        if (product) queryObj.product = product;
        if (status) queryObj.status = status;
        if (inspector) queryObj.inspector = inspector;
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            queryObj.date = { $gte: start, $lte: end };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [inspections, total] = await Promise.all([
            Inspection.find(queryObj)
                .populate('product', 'name category')
                .populate('inspector', 'name role')
                .skip(skip)
                .limit(limit),
            Inspection.countDocuments(queryObj)
        ]);

        res.status(200).json({
            success: true,
            count: inspections.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            },
            data: inspections
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getInspection = async (req, res) => {
    try {
        const inspection = await Inspection.findById(req.params.id)
            .populate('product', 'name category')
            .populate('inspector', 'name role');

        if (!inspection) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        const defects = await Defect.find({ inspection: req.params.id })
            .populate('product', 'name category')
            .populate('reportedBy', 'name role');

        res.status(200).json({ success: true, data: { inspection, defects } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateInspection = async (req, res) => {
    try {
        let inspection = await Inspection.findById(req.params.id);
        if (!inspection) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        inspection = await Inspection.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: inspection });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteInspection = async (req, res) => {
    try {
        const { id } = req.params;

        // Log the request
        console.log(`Attempting to delete inspection with ID: ${id}`);

        // Use findByIdAndDelete instead of findById and remove
        const deletedInspection = await Inspection.findByIdAndDelete(id);

        if (!deletedInspection) {
            console.log(`Inspection with ID ${id} not found`);
            return res.status(404).json({
                success: false,
                error: 'Inspection not found'
            });
        }

        console.log(`Successfully deleted inspection: ${id}`);

        // Also delete any defects associated with this inspection
        await Defect.deleteMany({ inspection: id });
        console.log(`Deleted associated defects for inspection: ${id}`);

        return res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(`Error deleting inspection: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: `Server Error: ${error.message}`
        });
    }
};

export const completeInspection = async (req, res) => {
    try {
        const inspection = await Inspection.findById(req.params.id);
        if (!inspection) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        const defectsCount = await Defect.countDocuments({ inspection: req.params.id });
        const status = defectsCount > 0 ? 'failed' : 'completed';

        inspection.status = status;
        inspection.defectsFound = defectsCount;

        await inspection.save();

        const defectRate = (defectsCount / inspection.totalInspected) * 100;
        const DEFECT_RATE_THRESHOLD = 5;

        if (defectRate > DEFECT_RATE_THRESHOLD) {
            await createDefectRateAlert(inspection, defectRate, DEFECT_RATE_THRESHOLD);
        }

        res.status(200).json({ success: true, data: inspection });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
